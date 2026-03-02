import Redis from 'ioredis';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '../enums/error-code.enum';
import { CustomError } from '../classes/custom-error';
import { getRedisConnection } from '../../config/redis/redis.config';
import { isRedisEnabled, parseBooleanEnv } from '../../utils/env.util';
import { getDefaultThrottleSettings } from '../../config/throttle/throttle.config';
import { THROTTLE_METADATA_KEY, ThrottleConfig } from '../decorators/throttle.decorator';
import { CanActivate, ExecutionContext, HttpStatus, Injectable, OnModuleDestroy } from '@nestjs/common';

type WindowState = {
  count: number;
  resetAt: number;
};

@Injectable()
export class ThrottleGuard implements CanActivate, OnModuleDestroy {
   private readonly windows = new Map<string, WindowState>();
   private readonly redisThrottleEnabled =
      parseBooleanEnv(process.env.THROTTLE_USE_REDIS, true) && isRedisEnabled();
   private readonly trustProxyEnabled = parseBooleanEnv(process.env.TRUST_PROXY, false);
   private redisClient?: Redis;

   constructor(private readonly reflector: Reflector) {}

   async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();

      if (!request) {
         return true;
      }

      const endpointConfig = this.reflector.getAllAndOverride<ThrottleConfig>(THROTTLE_METADATA_KEY, [
         context.getHandler(),
         context.getClass()
      ]);
      const defaultSettings = getDefaultThrottleSettings();

      const limit = endpointConfig?.limit ?? defaultSettings.limit;
      const ttlMs = endpointConfig?.ttlMs ?? defaultSettings.ttlMs;

      if (!defaultSettings.enabled || limit <= 0 || ttlMs <= 0) {
         return true;
      }

      const key = this.buildThrottleKey(request);
      const count = await this.incrementRequestCount(key, ttlMs);

      if (count > limit) {
         throw new CustomError(
            'Too many requests. Please try again later.',
            HttpStatus.TOO_MANY_REQUESTS,
            ErrorCode.RATE_LIMIT_EXCEEDED
         );
      }

      return true;
   }

   private buildThrottleKey(request: Request): string {
      const method = request.method || 'UNKNOWN';
      const routePath = request.route?.path || request.path || request.originalUrl || 'unknown-path';
      const ipAddress = this.getClientIp(request);

      return `${ipAddress}:${method}:${routePath}`;
   }

   private getClientIp(request: Request): string {
      const forwardedFor = request.headers['x-forwarded-for'];

      if (this.trustProxyEnabled) {
         if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
            return forwardedFor.split(',')[0].trim();
         }

         if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
            return forwardedFor[0].split(',')[0].trim();
         }
      }

      return request.ip || request.socket.remoteAddress || 'unknown-ip';
   }

   private cleanupExpiredWindows(): void {
      const now = Date.now();

      if (this.windows.size < 500) {
         return;
      }

      for (const [key, state] of this.windows.entries()) {
         if (state.resetAt <= now) {
            this.windows.delete(key);
         }
      }
   }

   private async incrementRequestCount(key: string, ttlMs: number): Promise<number> {
      const redisCount = await this.incrementRedisCount(key, ttlMs);
      if (redisCount !== null) {
         return redisCount;
      }

      return this.incrementInMemoryCount(key, ttlMs);
   }

   private async incrementRedisCount(key: string, ttlMs: number): Promise<number | null> {
      if (!this.redisThrottleEnabled) {
         return null;
      }

      try {
         const redisClient = await this.getRedisClient();
         if (!redisClient) {
            return null;
         }

         const redisKey = `throttle:${key}`;
         const currentCount = await redisClient.incr(redisKey);

         if (currentCount === 1) {
            await redisClient.pexpire(redisKey, ttlMs);
         }

         return currentCount;
      } catch {
         return null;
      }
   }

   private incrementInMemoryCount(key: string, ttlMs: number): number {
      this.cleanupExpiredWindows();

      const now = Date.now();
      const activeWindow = this.windows.get(key);

      if (!activeWindow || activeWindow.resetAt <= now) {
         this.windows.set(key, {
            count: 1,
            resetAt: now + ttlMs
         });
         return 1;
      }

      activeWindow.count += 1;
      this.windows.set(key, activeWindow);

      return activeWindow.count;
   }

   private async getRedisClient(): Promise<Redis | null> {
      if (!this.redisThrottleEnabled) {
         return null;
      }

      if (!this.redisClient) {
         this.redisClient = new Redis({
            ...getRedisConnection(),
            lazyConnect: true,
            maxRetriesPerRequest: 1
         });
      }

      if (this.redisClient.status === 'wait') {
         await this.redisClient.connect();
      }

      return this.redisClient;
   }

   async onModuleDestroy(): Promise<void> {
      if (this.redisClient) {
         await this.redisClient.quit();
         this.redisClient = undefined;
      }
   }
}

