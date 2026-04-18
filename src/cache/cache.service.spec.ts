import { AppCacheService } from './cache.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InternalServerErrorException } from '@nestjs/common';

describe('AppCacheService', () => {
   let service: AppCacheService;
   let mockCache: Record<string, jest.Mock>;

   beforeEach(async () => {
      mockCache = {
         get: jest.fn(),
         set: jest.fn(),
         del: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
         providers: [
            AppCacheService,
            { provide: CACHE_MANAGER, useValue: mockCache },
         ],
      }).compile();

      service = module.get<AppCacheService>(AppCacheService);
   });

   describe('get', () => {
      it('should return cached value', async () => {
         mockCache['get'].mockResolvedValue('cached-value');

         const result = await service.get<string>('key1');

         expect(result).toBe('cached-value');
         expect(mockCache['get']).toHaveBeenCalledWith('key1');
      });

      it('should return null when key does not exist', async () => {
         mockCache['get'].mockResolvedValue(undefined);

         const result = await service.get<string>('missing');

         expect(result).toBeNull();
      });

      it('should throw InternalServerErrorException on cache failure', async () => {
         mockCache['get'].mockRejectedValue(new Error('connection lost'));

         await expect(service.get('key1')).rejects.toThrow(InternalServerErrorException);
      });
   });

   describe('set', () => {
      it('should store value without explicit TTL', async () => {
         mockCache['set'].mockResolvedValue(undefined);

         await service.set('key1', 'value1');

         expect(mockCache['set']).toHaveBeenCalledWith('key1', 'value1');
      });

      it('should store value with TTL in milliseconds', async () => {
         mockCache['set'].mockResolvedValue(undefined);

         await service.set('key1', 'value1', 60);

         expect(mockCache['set']).toHaveBeenCalledWith('key1', 'value1', 60000);
      });

      it('should throw InternalServerErrorException on cache failure', async () => {
         mockCache['set'].mockRejectedValue(new Error('write error'));

         await expect(service.set('key1', 'val')).rejects.toThrow(InternalServerErrorException);
      });
   });

   describe('del', () => {
      it('should delete the key', async () => {
         mockCache['del'].mockResolvedValue(undefined);

         await service.del('key1');

         expect(mockCache['del']).toHaveBeenCalledWith('key1');
      });

      it('should throw InternalServerErrorException on cache failure', async () => {
         mockCache['del'].mockRejectedValue(new Error('delete error'));

         await expect(service.del('key1')).rejects.toThrow(InternalServerErrorException);
      });
   });

   describe('getOrSet', () => {
      it('should return cached value on cache hit', async () => {
         mockCache['get'].mockResolvedValue('cached');
         const loader = jest.fn();

         const result = await service.getOrSet('users:1', 60, loader);

         expect(result).toBe('cached');
         expect(loader).not.toHaveBeenCalled();
      });

      it('should call loader and cache result on cache miss', async () => {
         mockCache['get'].mockResolvedValue(undefined);
         mockCache['set'].mockResolvedValue(undefined);
         const loader = jest.fn().mockResolvedValue('loaded-value');

         const result = await service.getOrSet('users:2', 120, loader);

         expect(result).toBe('loaded-value');
         expect(loader).toHaveBeenCalled();
         expect(mockCache['set']).toHaveBeenCalledWith('users:2', 'loaded-value', 120000);
      });

      it('should throw if loader throws', async () => {
         mockCache['get'].mockResolvedValue(undefined);
         const loader = jest.fn().mockRejectedValue(new Error('loader failed'));

         await expect(service.getOrSet('key', 60, loader)).rejects.toThrow(
            InternalServerErrorException
         );
      });

      it('should re-throw InternalServerErrorException from get', async () => {
         mockCache['get'].mockRejectedValue(new Error('connection lost'));

         await expect(
            service.getOrSet('key', 60, jest.fn())
         ).rejects.toThrow(InternalServerErrorException);
      });
   });
});
