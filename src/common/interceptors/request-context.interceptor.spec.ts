import { of } from 'rxjs';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { RequestContextInterceptor } from './request-context.interceptor';

describe('RequestContextInterceptor', () => {
   let interceptor: RequestContextInterceptor;

   beforeEach(() => {
      interceptor = new RequestContextInterceptor();
   });

   function createMockContext(headers: Record<string, string> = {}, existingCorrelationId?: string) {
      const request: Record<string, unknown> = {
         headers,
         correlationId: existingCorrelationId,
      };
      const responseHeaders: Record<string, string> = {};
      const response = {
         setHeader: jest.fn((name: string, value: string) => {
            responseHeaders[name] = value;
         }),
      };

      const context = {
         switchToHttp: () => ({
            getRequest: () => request,
            getResponse: () => response,
         }),
      } as unknown as ExecutionContext;

      const next: CallHandler = { handle: () => of('result') };

      return { context, next, request, response, responseHeaders };
   }

   it('should generate a correlation ID when none is provided', (done) => {
      const { context, next, request, response } = createMockContext();

      interceptor.intercept(context, next).subscribe(() => {
         expect(request['correlationId']).toBeDefined();
         expect(typeof request['correlationId']).toBe('string');
         expect((request['correlationId'] as string).length).toBeGreaterThan(0);
         expect(response.setHeader).toHaveBeenCalledWith(
            'x-correlation-id',
            request['correlationId']
         );
         done();
      });
   });

   it('should use existing x-correlation-id header', (done) => {
      const { context, next, request, response } = createMockContext({
         'x-correlation-id': 'from-header',
      });

      interceptor.intercept(context, next).subscribe(() => {
         expect(request['correlationId']).toBe('from-header');
         expect(response.setHeader).toHaveBeenCalledWith('x-correlation-id', 'from-header');
         done();
      });
   });

   it('should use existing x-request-id header as fallback', (done) => {
      const { context, next, request, response } = createMockContext({
         'x-request-id': 'req-id-fallback',
      });

      interceptor.intercept(context, next).subscribe(() => {
         expect(request['correlationId']).toBe('req-id-fallback');
         expect(response.setHeader).toHaveBeenCalledWith('x-correlation-id', 'req-id-fallback');
         done();
      });
   });

   it('should prefer request.correlationId over headers', (done) => {
      const { context, next, request } = createMockContext(
         { 'x-correlation-id': 'header-value' },
         'existing-value'
      );

      interceptor.intercept(context, next).subscribe(() => {
         expect(request['correlationId']).toBe('existing-value');
         done();
      });
   });

   it('should pass through to next handler', (done) => {
      const { context, next } = createMockContext();

      interceptor.intercept(context, next).subscribe((result) => {
         expect(result).toBe('result');
         done();
      });
   });
});
