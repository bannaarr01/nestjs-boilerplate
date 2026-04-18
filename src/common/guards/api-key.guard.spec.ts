import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { META_PUBLIC } from 'nestjs-keycloak-auth';
import { CustomError } from '../classes/custom-error';
import { ErrorCode } from '../enums/error-code.enum';
import { ApiKeyGuard } from './api-key.guard';
import { Reflector } from '@nestjs/core';

function createMockContext(
   path: string,
   headers: Record<string, string | string[] | undefined> = {}
): ExecutionContext {
   return {
      switchToHttp: () => ({
         getRequest: () => ({ path, headers })
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
   } as unknown as ExecutionContext;
}

describe('ApiKeyGuard', () => {
   let guard: ApiKeyGuard;
   let reflector: Reflector;
   let originalApiKey: string | undefined;

   beforeEach(() => {
      originalApiKey = process.env.API_KEY;
      process.env.API_KEY = 'test-api-key';

      reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) } as unknown as Reflector;
      guard = new ApiKeyGuard(reflector);
   });

   afterEach(() => {
      if (originalApiKey === undefined) {
         delete process.env.API_KEY;
      } else {
         process.env.API_KEY = originalApiKey;
      }
   });

   it('should allow excluded routes', () => {
      expect(guard.canActivate(createMockContext('/docs'))).toBe(true);
      expect(guard.canActivate(createMockContext('/api/v1/healthz'))).toBe(true);
      expect(guard.canActivate(createMockContext('/api/healthz'))).toBe(true);
      expect(guard.canActivate(createMockContext('/docs-json'))).toBe(true);
      expect(guard.canActivate(createMockContext('/favicon.ico'))).toBe(true);
   });

   it('should allow public routes', () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
      const ctx = createMockContext('/api/v1/some-route');

      expect(guard.canActivate(ctx)).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
         META_PUBLIC,
         expect.any(Array),
      );
   });

   it('should throw when API_KEY env is not set', () => {
      delete process.env.API_KEY;
      const ctx = createMockContext('/api/v1/resource', { 'x-api-key': 'any-key' });

      expect(() => guard.canActivate(ctx)).toThrow(CustomError);
      expect(() => guard.canActivate(ctx)).toThrow('API key not configured');
   });

   it('should throw when no x-api-key header is provided', () => {
      const ctx = createMockContext('/api/v1/resource');

      expect(() => guard.canActivate(ctx)).toThrow(CustomError);
      expect(() => guard.canActivate(ctx)).toThrow('Invalid or missing API key');
   });

   it('should throw when wrong API key is provided', () => {
      const ctx = createMockContext('/api/v1/resource', { 'x-api-key': 'wrong-key' });

      try {
         guard.canActivate(ctx);
         fail('Expected CustomError to be thrown');
      } catch (err) {
         expect(err).toBeInstanceOf(CustomError);
         expect((err as CustomError).statusCode).toBe(HttpStatus.UNAUTHORIZED);
         expect((err as CustomError).errorCode).toBe(ErrorCode.UNAUTHORIZED);
      }
   });

   it('should allow when correct API key is provided', () => {
      const ctx = createMockContext('/api/v1/resource', { 'x-api-key': 'test-api-key' });

      expect(guard.canActivate(ctx)).toBe(true);
   });

   it('should handle array header value', () => {
      const ctx = createMockContext('/api/v1/resource', { 'x-api-key': ['test-api-key', 'other'] });

      expect(guard.canActivate(ctx)).toBe(true);
   });
});
