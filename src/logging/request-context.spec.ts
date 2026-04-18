import {
   requestContext,
   getRequestId,
   getRequestContext,
   runWithRequestContext,
   updateRequestContext
} from './request-context';

describe('RequestContext', () => {
   it('should return undefined when no context is set', () => {
      expect(getRequestId()).toBeUndefined();
      expect(getRequestContext()).toBeUndefined();
   });

   it('should provide correlationId within runWithRequestContext', () => {
      runWithRequestContext({ correlationId: 'abc-123' }, () => {
         expect(getRequestId()).toBe('abc-123');
      });
   });

   it('should provide full context within runWithRequestContext', () => {
      const ctx = { correlationId: 'req-1', method: 'GET', path: '/test', userId: 42 };

      runWithRequestContext(ctx, () => {
         const result = getRequestContext();
         expect(result).toEqual(ctx);
      });
   });

   it('should return the value from the handler', () => {
      const result = runWithRequestContext({ correlationId: 'x' }, () => 'hello');
      expect(result).toBe('hello');
   });

   it('should isolate contexts between nested calls', () => {
      runWithRequestContext({ correlationId: 'outer' }, () => {
         expect(getRequestId()).toBe('outer');

         runWithRequestContext({ correlationId: 'inner' }, () => {
            expect(getRequestId()).toBe('inner');
         });

         expect(getRequestId()).toBe('outer');
      });
   });

   it('should update context with partial patch', () => {
      runWithRequestContext({ correlationId: 'req-1', method: 'GET' }, () => {
         updateRequestContext({ userId: 99 });
         const ctx = getRequestContext();
         expect(ctx?.userId).toBe(99);
         expect(ctx?.correlationId).toBe('req-1');
         expect(ctx?.method).toBe('GET');
      });
   });

   it('should not throw when updateRequestContext is called outside context', () => {
      expect(() => updateRequestContext({ userId: 1 })).not.toThrow();
   });

   it('should expose the raw AsyncLocalStorage instance', () => {
      expect(requestContext).toBeDefined();
      expect(typeof requestContext.run).toBe('function');
   });
});
