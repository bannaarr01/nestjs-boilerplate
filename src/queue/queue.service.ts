import { Job, Queue } from 'bullmq';
import { QueueJobDto } from './dto/queue-job.dto';
import { isRedisEnabled } from '../utils/env.util';
import { QueueHealthDto } from './dto/queue-health.dto';
import { QueueMetricsDto } from './dto/queue-metrics.dto';
import { CustomError } from '../common/classes/custom-error';
import { EnqueueDemoJobDto } from './dto/enqueue-demo-job.dto';
import { getRedisConnection } from '../config/redis/redis.config';
import { SchedulerMetricsDto } from './dto/scheduler-metrics.dto';
import { defaultBullMQOptions } from '../config/queue/queue.config';
import { HttpStatus, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ErrorHandlerService } from '../common/services/error-handler.service';

@Injectable()
export class QueueService implements OnModuleDestroy {
   private readonly queueName = process.env.QUEUE_GENERAL_NAME || 'general';
   private readonly redisEnabled = isRedisEnabled();
   private readonly exposeErrorDetails = (process.env.NODE_ENV || '').toLowerCase() !== 'production';
   private readonly startTime = new Date();
   private queue?: Queue;

   constructor(private readonly errorHandler: ErrorHandlerService) {}

   async getHealth(): Promise<QueueHealthDto> {
      if (!this.redisEnabled) {
         return {
            enabled: false,
            healthy: true,
            status: 'disabled',
            queueName: this.queueName
         };
      }

      try {
         const queue = await this.ensureQueue();
         const client = await queue.client;
         const ping = await client.ping();

         return {
            enabled: true,
            healthy: ping === 'PONG',
            status: ping === 'PONG' ? 'ready' : 'degraded',
            queueName: this.queueName
         };
      } catch (error) {
         return {
            enabled: true,
            healthy: false,
            status: 'error',
            queueName: this.queueName,
            errorMessage: this.exposeErrorDetails
               ? error instanceof Error
                  ? error.message
                  : 'Unknown queue error'
               : 'Queue is unavailable'
         };
      }
   }

   getSupportedQueueTypes(): string[] {
      return [this.queueName];
   }

   async getMetrics(): Promise<QueueMetricsDto> {
      try {
         const queue = await this.ensureQueue();

         const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount()
         ]);
         const paused = await queue.isPaused();

         return {
            queueName: this.queueName,
            waiting,
            active,
            completed,
            failed,
            delayed,
            paused,
            total: waiting + active + completed + failed + delayed
         };
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, QueueService, '.getMetrics');
      }
   }

   async getAllQueueMetrics(): Promise<QueueMetricsDto[]> {
      try {
         const metrics = await this.getMetrics();
         return [metrics];
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, QueueService, '.getAllQueueMetrics');
      }
   }

   async getSchedulerMetrics(): Promise<SchedulerMetricsDto> {
      try {
         const queueMetrics = await this.getAllQueueMetrics();
         const uptimeMs = Date.now() - this.startTime.getTime();

         return {
            queueMetrics,
            uptimeMs,
            lastHealthCheck: new Date().toISOString()
         };
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, QueueService, '.getSchedulerMetrics');
      }
   }

   async getQueueStatus(queueType: string): Promise<QueueMetricsDto> {
      try {
         this.ensureQueueTypeSupported(queueType);
         return await this.getMetrics();
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, QueueService, '.getQueueStatus');
      }
   }

   async enqueueDemoJob(input: EnqueueDemoJobDto): Promise<{ jobId: string; queueName: string }> {
      try {
         const queue = await this.ensureQueue();
         const job = await queue.add(
            'demo',
            {
               payload: input.payload || 'demo job',
               createdAt: new Date().toISOString()
            },
            {
               ...defaultBullMQOptions,
               removeOnComplete: {
                  age: Number(process.env.QUEUE_JOB_REMOVE_ON_COMPLETE_AGE || 3600)
               },
               removeOnFail: {
                  age: Number(process.env.QUEUE_JOB_REMOVE_ON_FAIL_AGE || 86400)
               }
            }
         );

         return {
            jobId: String(job.id),
            queueName: this.queueName
         };
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, QueueService, '.enqueueDemoJob');
      }
   }

   async getJob(jobId: string): Promise<QueueJobDto> {
      try {
         const queue = await this.ensureQueue();
         const job = await queue.getJob(jobId);

         if (!job) {
            throw new CustomError(`Queue job not found: ${jobId}`, HttpStatus.NOT_FOUND);
         }

         return this.mapJob(job);
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, QueueService, '.getJob');
      }
   }

   async getActiveJobsSummary(): Promise<QueueJobDto[]> {
      try {
         const queue = await this.ensureQueue();
         const jobs = await queue.getJobs(['active'], 0, 49, false);

         return Promise.all(jobs.map(job => this.mapJob(job)));
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, QueueService, '.getActiveJobsSummary');
      }
   }

   async getFailedJobsSummary(limit: number): Promise<QueueJobDto[]> {
      try {
         const queue = await this.ensureQueue();
         const safeLimit = Math.min(Math.max(limit || 10, 1), 100);
         const jobs = await queue.getJobs(['failed'], 0, safeLimit - 1, false);

         return Promise.all(jobs.map(job => this.mapJob(job)));
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, QueueService, '.getFailedJobsSummary');
      }
   }

   async onModuleDestroy(): Promise<void> {
      if (this.queue) {
         await this.queue.close();
         this.queue = undefined;
      }
   }

   private async ensureQueue(): Promise<Queue> {
      if (!this.redisEnabled) {
         throw new CustomError(
            'Redis/BullMQ is disabled. Enable it with REDIS_ENABLED=true or --redis=on.',
            HttpStatus.SERVICE_UNAVAILABLE
         );
      }

      if (!this.queue) {
         this.queue = new Queue(this.queueName, {
            connection: getRedisConnection(),
            defaultJobOptions: defaultBullMQOptions
         });
      }

      await this.queue.waitUntilReady();

      return this.queue;
   }

   private ensureQueueTypeSupported(queueType: string): void {
      if (!queueType || queueType !== this.queueName) {
         throw new CustomError(
            `Unsupported queue type "${queueType}". Supported queue types: ${this.queueName}`,
            HttpStatus.BAD_REQUEST
         );
      }
   }

   private async mapJob(job: Job): Promise<QueueJobDto> {
      return {
         id: String(job.id),
         name: job.name,
         state: await job.getState(),
         attemptsMade: job.attemptsMade,
         data: job.data as Record<string, unknown>,
         failedReason: job.failedReason || null
      };
   }
}

