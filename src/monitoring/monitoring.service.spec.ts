import { MonitoringService } from './monitoring.service';

describe('MonitoringService', () => {
   let service: MonitoringService;

   beforeEach(() => {
      service = new MonitoringService();
   });

   describe('recordRequest', () => {
      it('should increment total request count', () => {
         service.recordRequest({ method: 'GET', path: '/api/test' });
         service.recordRequest({ method: 'POST', path: '/api/data' });

         const snapshot = service.getSnapshot();
         expect(snapshot['totalRequests']).toBe(2);
      });
   });

   describe('recordRequestError', () => {
      it('should increment total error count', () => {
         service.recordRequestError({
            method: 'GET',
            path: '/api/fail',
            message: 'Not Found',
            statusCode: 404
         });

         const snapshot = service.getSnapshot();
         expect(snapshot['totalErrors']).toBe(1);
      });
   });

   describe('recordSlowRequest', () => {
      it('should track slow endpoints', () => {
         service.recordSlowRequest({
            method: 'GET',
            path: '/api/slow',
            durationMs: 5000
         });
         service.recordSlowRequest({
            method: 'GET',
            path: '/api/slow',
            durationMs: 7000
         });

         const snapshot = service.getSnapshot();
         const slowEndpoints = snapshot['slowEndpoints'] as Array<Record<string, unknown>>;
         expect(slowEndpoints).toHaveLength(1);
         expect(slowEndpoints[0]!['count']).toBe(2);
         expect(slowEndpoints[0]!['maxMs']).toBe(7000);
      });

      it('should auto-record slow requests via recordRequest', () => {
         service.recordRequest({
            method: 'GET',
            path: '/api/slow',
            durationMs: 5000
         });

         const snapshot = service.getSnapshot();
         const slowEndpoints = snapshot['slowEndpoints'] as Array<Record<string, unknown>>;
         expect(slowEndpoints).toHaveLength(1);
      });
   });

   describe('cache stats', () => {
      it('should record cache hits and misses', () => {
         service.recordCacheHit('users');
         service.recordCacheHit('users');
         service.recordCacheMiss('users');
         service.recordCacheHit('products');

         const snapshot = service.getSnapshot();
         const cacheStats = snapshot['cacheStats'] as Record<string, Record<string, unknown>>;
         expect(cacheStats['users']!['hits']).toBe(2);
         expect(cacheStats['users']!['misses']).toBe(1);
         expect(cacheStats['users']!['hitRatio']).toBeCloseTo(0.6667, 3);
         expect(cacheStats['products']!['hits']).toBe(1);
         expect(cacheStats['products']!['misses']).toBe(0);
         expect(cacheStats['products']!['hitRatio']).toBe(1);
      });
   });

   describe('getSnapshot', () => {
      it('should return complete metrics snapshot', () => {
         service.recordRequest({ method: 'GET', path: '/test' });
         service.recordRequestError({ method: 'GET', path: '/test', message: 'err' });
         service.recordCacheHit('test');

         const snapshot = service.getSnapshot();
         expect(snapshot).toHaveProperty('collectedAt');
         expect(snapshot).toHaveProperty('uptimeMs');
         expect(snapshot).toHaveProperty('totalRequests');
         expect(snapshot).toHaveProperty('totalErrors');
         expect(snapshot).toHaveProperty('errorRate');
         expect(snapshot).toHaveProperty('slowApiThresholdMs');
         expect(snapshot).toHaveProperty('slowEndpoints');
         expect(snapshot).toHaveProperty('cacheStats');
      });

      it('should calculate error rate correctly', () => {
         service.recordRequest({ method: 'GET', path: '/a' });
         service.recordRequest({ method: 'GET', path: '/b' });
         service.recordRequestError({ method: 'GET', path: '/a', message: 'err' });

         const snapshot = service.getSnapshot();
         expect(snapshot['errorRate']).toBe(0.5);
      });

      it('should return 0 error rate when no requests', () => {
         const snapshot = service.getSnapshot();
         expect(snapshot['errorRate']).toBe(0);
      });
   });

   describe('reset', () => {
      it('should clear all counters and maps', () => {
         service.recordRequest({ method: 'GET', path: '/test' });
         service.recordRequestError({ method: 'GET', path: '/test', message: 'err' });
         service.recordCacheHit('test');
         service.recordSlowRequest({ method: 'GET', path: '/slow', durationMs: 5000 });

         service.reset();

         const snapshot = service.getSnapshot();
         expect(snapshot['totalRequests']).toBe(0);
         expect(snapshot['totalErrors']).toBe(0);
         expect((snapshot['slowEndpoints'] as unknown[]).length).toBe(0);
         expect(Object.keys(snapshot['cacheStats'] as object).length).toBe(0);
      });
   });
});
