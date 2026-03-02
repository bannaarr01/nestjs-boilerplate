import { QueueService } from './queue.service';
import { ApiResponse } from '../utils/api.util';
import { QueueJobDto } from './dto/queue-job.dto';
import { QueueHealthDto } from './dto/queue-health.dto';
import { QueueMetricsDto } from './dto/queue-metrics.dto';
import { GetFailedJobsDto } from './dto/get-failed-jobs.dto';
import { QueueJobParamDto } from './dto/queue-job-param.dto';
import { ApiVersion } from '../common/enums/api-version.enum';
import { Public } from '../common/decorators/public.decorator';
import { EnqueueDemoJobDto } from './dto/enqueue-demo-job.dto';
import { QueueTypeParamDto } from './dto/queue-type-param.dto';
import { SchedulerMetricsDto } from './dto/scheduler-metrics.dto';
import { Throttle } from '../common/decorators/throttle.decorator';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ErrorHandlerService } from '../common/services/error-handler.service';
import { ApiOperationAndResponses } from '../common/decorators/api-ops.decorator';
import { Body, Controller, Get, HttpStatus, Param, Post, Query, Version } from '@nestjs/common';

@ApiTags('Queue')
@Controller('queue')
@ApiSecurity('x-api-key')
@ApiBearerAuth()
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly errorHandler: ErrorHandlerService
  ) {}

  @Public()
  @Get('health')
  @Version(ApiVersion.ONE)
  @ApiOperationAndResponses({
    summary: 'Queue health check',
    description: 'Checks BullMQ + Redis connectivity for the default queue.',
    responseModel: QueueHealthDto,
    responseDescriptions: {
      [HttpStatus.OK]: 'Queue is healthy or disabled intentionally',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'Queue is enabled but unhealthy'
    }
  })
  async getHealth(): Promise<ApiResponse<QueueHealthDto>> {
    try {
      const data = await this.queueService.getHealth();
      const statusCode = data.healthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

      return new ApiResponse(data, {
        statusCode,
        message: data.healthy ? 'Queue status OK' : 'Queue status degraded'
      });
    } catch (error) {
      this.errorHandler.handleControllerError(error, QueueController, '.getHealth');
    }
  }

  @Get('metrics')
  @Version(ApiVersion.ONE)
  @ApiOperationAndResponses({
    summary: 'Get scheduler and queue metrics',
    description: 'Returns scheduler uptime and queue metrics for registered queues.',
    responseModel: SchedulerMetricsDto
  })
  async getMetrics(): Promise<ApiResponse<SchedulerMetricsDto>> {
    try {
      const data = await this.queueService.getSchedulerMetrics();
      return new ApiResponse(data);
    } catch (error) {
      this.errorHandler.handleControllerError(error, QueueController, '.getMetrics');
    }
  }

  @Get('queues')
  @Version(ApiVersion.ONE)
  @ApiOperationAndResponses({
    summary: 'Get queue metrics',
    description: 'Returns metrics for all registered queues.',
    responseModel: QueueMetricsDto,
    isArray: true
  })
  async getQueueMetrics(): Promise<ApiResponse<QueueMetricsDto[]>> {
    try {
      const data = await this.queueService.getAllQueueMetrics();
      return new ApiResponse(data);
    } catch (error) {
      this.errorHandler.handleControllerError(error, QueueController, '.getQueueMetrics');
    }
  }

  @Get('queues/types')
  @Version(ApiVersion.ONE)
  @ApiOperationAndResponses({
    summary: 'Get supported queue types',
    description: 'Returns supported queue types available in this service.'
  })
  async getSupportedQueueTypes(): Promise<ApiResponse<string[]>> {
    try {
      const data = this.queueService.getSupportedQueueTypes();
      return new ApiResponse(data);
    } catch (error) {
      this.errorHandler.handleControllerError(error, QueueController, '.getSupportedQueueTypes');
    }
  }

  @Get('queues/:queueType/status')
  @Version(ApiVersion.ONE)
  @ApiOperationAndResponses({
    summary: 'Get specific queue status',
    description: 'Returns queue metrics for a single queue type.',
    responseModel: QueueMetricsDto,
    responseDescriptions: {
      [HttpStatus.BAD_REQUEST]: 'Unsupported queue type'
    }
  })
  async getQueueStatus(@Param() params: QueueTypeParamDto): Promise<ApiResponse<QueueMetricsDto>> {
    try {
      const data = await this.queueService.getQueueStatus(params.queueType);
      return new ApiResponse(data);
    } catch (error) {
      this.errorHandler.handleControllerError(error, QueueController, '.getQueueStatus');
    }
  }

  @Get('jobs/active')
  @Version(ApiVersion.ONE)
  @ApiOperationAndResponses({
    summary: 'Get active jobs',
    description: 'Returns active jobs from the default queue.',
    responseModel: QueueJobDto,
    isArray: true
  })
  async getActiveJobs(): Promise<ApiResponse<QueueJobDto[]>> {
    try {
      const data = await this.queueService.getActiveJobsSummary();
      return new ApiResponse(data);
    } catch (error) {
      this.errorHandler.handleControllerError(error, QueueController, '.getActiveJobs');
    }
  }

  @Get('jobs/failed')
  @Version(ApiVersion.ONE)
  @ApiOperationAndResponses({
    summary: 'Get failed jobs',
    description: 'Returns failed jobs from the default queue with optional limit.',
    responseModel: QueueJobDto,
    isArray: true
  })
  async getFailedJobs(@Query() query: GetFailedJobsDto): Promise<ApiResponse<QueueJobDto[]>> {
    try {
      const data = await this.queueService.getFailedJobsSummary(query.limit);
      return new ApiResponse(data);
    } catch (error) {
      this.errorHandler.handleControllerError(error, QueueController, '.getFailedJobs');
    }
  }

  @Post('jobs/demo')
  @Version(ApiVersion.ONE)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperationAndResponses({
    summary: 'Enqueue demo job',
    description: 'Adds a basic demo job to the default BullMQ queue. Rate limit: 5 requests in 1 minute per client.',
    responseDescriptions: {
      [HttpStatus.CREATED]: 'Demo job queued successfully'
    },
    responseStatus: HttpStatus.CREATED
  })
  async enqueueDemoJob(
    @Body() input: EnqueueDemoJobDto
  ): Promise<ApiResponse<{ jobId: string; queueName: string }>> {
    try {
      const data = await this.queueService.enqueueDemoJob(input);

      return new ApiResponse(data, {
        statusCode: HttpStatus.CREATED,
        message: 'Created'
      });
    } catch (error) {
      this.errorHandler.handleControllerError(error, QueueController, '.enqueueDemoJob');
    }
  }

  @Get('jobs/:jobId')
  @Version(ApiVersion.ONE)
  @ApiOperationAndResponses({
    summary: 'Get queue job',
    description: 'Returns one job detail from default queue by id.',
    responseModel: QueueJobDto,
    responseDescriptions: {
      [HttpStatus.NOT_FOUND]: 'Queue job not found'
    }
  })
  async getJob(@Param() params: QueueJobParamDto): Promise<ApiResponse<QueueJobDto>> {
    try {
      const data = await this.queueService.getJob(params.jobId);
      return new ApiResponse(data);
    } catch (error) {
      this.errorHandler.handleControllerError(error, QueueController, '.getJob');
    }
  }
}

