import { of } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { ResponseInterceptor } from './response.interceptor';
import { CallHandler, ExecutionContext, HttpStatus } from '@nestjs/common';
import { WRAP_RESPONSE_KEY, WRAP_RESPONSE_MESSAGE_KEY } from '../decorators/wrap-response.decorator';

describe('ResponseInterceptor', () => {
   let interceptor: ResponseInterceptor<unknown>;
   let reflector: Reflector;

   beforeEach(() => {
      reflector = new Reflector();
      interceptor = new ResponseInterceptor(reflector);
   });

   function createMockContext(statusCode = HttpStatus.OK) {
      return {
         switchToHttp: () => ({
            getResponse: () => ({ statusCode }),
         }),
         getHandler: () => ({}),
         getClass: () => ({}),
      } as unknown as ExecutionContext;
   }

   function createNext(data: unknown): CallHandler {
      return { handle: () => of(data) };
   }

   it('should wrap a plain object in { statusCode, message, data }', (done) => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = createMockContext();
      const next = createNext({ name: 'test' });

      interceptor.intercept(context, next).subscribe((result) => {
         expect(result).toEqual({
            statusCode: 200,
            message: 'OK',
            data: { name: 'test' },
         });
         done();
      });
   });

   it('should pass through already-wrapped responses', (done) => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const wrapped = { statusCode: 200, message: 'OK', data: { id: 1 } };
      const context = createMockContext();
      const next = createNext(wrapped);

      interceptor.intercept(context, next).subscribe((result) => {
         expect(result).toBe(wrapped);
         done();
      });
   });

   it('should skip wrapping when @UnwrapResponse() is used', (done) => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
         if (key === WRAP_RESPONSE_KEY) return false;
         return undefined;
      });

      const rawData = { raw: true };
      const context = createMockContext();
      const next = createNext(rawData);

      interceptor.intercept(context, next).subscribe((result) => {
         expect(result).toBe(rawData);
         done();
      });
   });

   it('should use custom message from @WrapResponse(message)', (done) => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
         if (key === WRAP_RESPONSE_KEY) return true;
         if (key === WRAP_RESPONSE_MESSAGE_KEY) return 'Created successfully';
         return undefined;
      });

      const context = createMockContext(HttpStatus.CREATED);
      const next = createNext({ id: 5 });

      interceptor.intercept(context, next).subscribe((result) => {
         expect(result).toEqual({
            statusCode: HttpStatus.CREATED,
            message: 'Created successfully',
            data: { id: 5 },
         });
         done();
      });
   });

   it('should handle pagination responses', (done) => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const paginatedData = {
         data: [{ id: 1 }, { id: 2 }],
         pagination: { page: 1, total: 10 },
      };
      const context = createMockContext();
      const next = createNext(paginatedData);

      interceptor.intercept(context, next).subscribe((result) => {
         expect(result).toEqual({
            statusCode: 200,
            message: 'OK',
            data: [{ id: 1 }, { id: 2 }],
            pagination: { page: 1, total: 10 },
         });
         done();
      });
   });

   it('should handle pagination with items key', (done) => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const paginatedData = {
         items: [{ id: 3 }],
         pagination: { page: 1, total: 1 },
      };
      const context = createMockContext();
      const next = createNext(paginatedData);

      interceptor.intercept(context, next).subscribe((result) => {
         expect(result).toEqual({
            statusCode: 200,
            message: 'OK',
            data: [{ id: 3 }],
            pagination: { page: 1, total: 1 },
         });
         done();
      });
   });

   it('should wrap null data', (done) => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = createMockContext();
      const next = createNext(null);

      interceptor.intercept(context, next).subscribe((result) => {
         expect(result).toEqual({
            statusCode: 200,
            message: 'OK',
            data: null,
         });
         done();
      });
   });

   it('should wrap primitive data', (done) => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const context = createMockContext();
      const next = createNext('hello');

      interceptor.intercept(context, next).subscribe((result) => {
         expect(result).toEqual({
            statusCode: 200,
            message: 'OK',
            data: 'hello',
         });
         done();
      });
   });
});
