import type { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { LoggingService } from '../logging/logging.service';
import { MonitoringService } from '../monitoring/monitoring.service';
import { Inject, Injectable, InternalServerErrorException, Optional } from '@nestjs/common';

@Injectable()
export class AppCacheService {
   constructor(
      @Inject(CACHE_MANAGER) private readonly cache: Cache,
      @Optional() private readonly monitoringService?: MonitoringService,
      @Optional() private readonly logger?: LoggingService,
   ) {}

   async get<T>(key: string): Promise<T | null> {
      try {
         const value = await this.cache.get<T>(key);
         return value ?? null;
      } catch (error) {
         this.logError('get', error, { key });
         const message = error instanceof Error ? error.message : 'Unknown error';
         throw new InternalServerErrorException(`Cache get failed: ${message}`);
      }
   }

   async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
      try {
         if (ttlSeconds && ttlSeconds > 0) {
            await this.cache.set(key, value, ttlSeconds * 1000);
            return;
         }
         await this.cache.set(key, value);
      } catch (error) {
         this.logError('set', error, { key });
         const message = error instanceof Error ? error.message : 'Unknown error';
         throw new InternalServerErrorException(`Cache set failed: ${message}`);
      }
   }

   async del(key: string): Promise<void> {
      try {
         await this.cache.del(key);
      } catch (error) {
         this.logError('del', error, { key });
         const message = error instanceof Error ? error.message : 'Unknown error';
         throw new InternalServerErrorException(`Cache delete failed: ${message}`);
      }
   }

   async getOrSet<T>(
      key: string,
      ttlSeconds: number,
      loader: () => Promise<T>,
   ): Promise<T> {
      try {
         const keyFamily = this.resolveKeyFamily(key);
         const cached = await this.get<T>(key);

         if (cached !== null) {
            this.monitoringService?.recordCacheHit(keyFamily);
            return cached;
         }

         this.monitoringService?.recordCacheMiss(keyFamily);

         const loaded = await loader();
         await this.set<T>(key, loaded, ttlSeconds);
         return loaded;
      } catch (error) {
         if (error instanceof InternalServerErrorException) throw error;
         this.logError('getOrSet', error, { key });
         const message = error instanceof Error ? error.message : 'Unknown error';
         throw new InternalServerErrorException(`Cache getOrSet failed: ${message}`);
      }
   }

   private resolveKeyFamily(key: string): string {
      const source = String(key ?? '').trim();
      if (!source) {
         return 'unknown';
      }
      const [family] = source.split(':');
      return family || 'unknown';
   }

   private logError(method: string, error: unknown, meta: Record<string, unknown>): void {
      if (!this.logger) return;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.getLogger().error(`AppCacheService.${method}: ${message}`, {
         label: 'AppCacheService',
         ...meta,
      });
   }
}
