import { Injectable } from '@nestjs/common';

type RequestMeta = {
   method?: string;
   path?: string;
   correlationId?: string;
   statusCode?: number;
   durationMs?: number;
};

type ErrorMeta = {
   correlationId?: string;
   method?: string;
   path?: string;
   userId?: number | string | null;
   statusCode?: number;
   message: string;
};

type SlowEndpointStats = {
   method: string;
   path: string;
   count: number;
   maxMs: number;
};

type CacheStats = {
   hits: number;
   misses: number;
};

@Injectable()
export class MonitoringService {
   private readonly slowApiThresholdMs = this.resolveNumberEnv('SLOW_API_THRESHOLD_MS', 3000);

   private totalRequests = 0;
   private totalErrors = 0;
   private readonly endpointCounts = new Map<string, number>();
   private readonly endpointErrorCounts = new Map<string, number>();
   private readonly slowEndpoints = new Map<string, SlowEndpointStats>();
   private readonly cacheStats = new Map<string, CacheStats>();
   private readonly startedAt = Date.now();

   recordRequest(meta: RequestMeta): void {
      this.totalRequests++;
      const key = this.endpointKey(meta.method, meta.path);
      this.endpointCounts.set(key, (this.endpointCounts.get(key) ?? 0) + 1);

      if (meta.durationMs !== undefined && meta.durationMs >= this.slowApiThresholdMs) {
         this.recordSlowRequest(meta);
      }
   }

   recordRequestError(meta: ErrorMeta): void {
      this.totalErrors++;
      const key = this.endpointKey(meta.method, meta.path);
      this.endpointErrorCounts.set(key, (this.endpointErrorCounts.get(key) ?? 0) + 1);
   }

   recordSlowRequest(meta: RequestMeta): void {
      const key = this.endpointKey(meta.method, meta.path);
      const current = this.slowEndpoints.get(key);
      const duration = meta.durationMs ?? 0;

      if (!current) {
         this.slowEndpoints.set(key, {
            method: String(meta.method ?? 'UNKNOWN').toUpperCase(),
            path: this.normalizePath(meta.path),
            count: 1,
            maxMs: duration,
         });
         return;
      }

      current.count++;
      current.maxMs = Math.max(current.maxMs, duration);
   }

   recordCacheHit(keyFamily: string): void {
      const stats = this.ensureCacheStats(keyFamily);
      stats.hits++;
   }

   recordCacheMiss(keyFamily: string): void {
      const stats = this.ensureCacheStats(keyFamily);
      stats.misses++;
   }

   getSnapshot(): Record<string, unknown> {
      const cacheStatsObj: Record<string, { hits: number; misses: number; hitRatio: number }> = {};
      for (const [family, stats] of this.cacheStats) {
         const total = stats.hits + stats.misses;
         cacheStatsObj[family] = {
            hits: stats.hits,
            misses: stats.misses,
            hitRatio: total > 0 ? Number((stats.hits / total).toFixed(4)) : 0,
         };
      }

      const slowEndpointsList = [...this.slowEndpoints.values()]
         .sort((a, b) => b.count - a.count)
         .slice(0, 20);

      return {
         collectedAt: new Date().toISOString(),
         uptimeMs: Date.now() - this.startedAt,
         totalRequests: this.totalRequests,
         totalErrors: this.totalErrors,
         errorRate: this.totalRequests > 0
            ? Number((this.totalErrors / this.totalRequests).toFixed(4))
            : 0,
         slowApiThresholdMs: this.slowApiThresholdMs,
         slowEndpoints: slowEndpointsList,
         cacheStats: cacheStatsObj,
      };
   }

   reset(): void {
      this.totalRequests = 0;
      this.totalErrors = 0;
      this.endpointCounts.clear();
      this.endpointErrorCounts.clear();
      this.slowEndpoints.clear();
      this.cacheStats.clear();
   }

   private ensureCacheStats(keyFamily: string): CacheStats {
      const existing = this.cacheStats.get(keyFamily);
      if (existing) return existing;
      const stats: CacheStats = { hits: 0, misses: 0 };
      this.cacheStats.set(keyFamily, stats);
      return stats;
   }

   private endpointKey(method?: string, path?: string): string {
      return `${String(method ?? 'UNKNOWN').toUpperCase()} ${this.normalizePath(path)}`;
   }

   private normalizePath(path?: string): string {
      const source = String(path ?? '').trim();
      if (!source) return '/unknown';
      const base = source.split('?')[0] || '/unknown';
      if (base.length > 1 && base.endsWith('/')) {
         return base.slice(0, -1);
      }
      return base;
   }

   private resolveNumberEnv(name: string, fallback: number): number {
      const raw = process.env[name];
      const value = Number(raw);
      if (!raw || !Number.isFinite(value) || value <= 0) {
         return fallback;
      }
      return value;
   }
}
