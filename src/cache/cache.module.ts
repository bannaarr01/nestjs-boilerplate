import { Global, Module } from '@nestjs/common';
import { AppCacheService } from './cache.service';
import { CacheModule } from '@nestjs/cache-manager';

@Global()
@Module({
   imports: [
      CacheModule.register({
         ttl: Number(process.env['CACHE_TTL_DEFAULT'] ?? 300) * 1000,
         max: Number(process.env['CACHE_MAX_ITEMS'] ?? 1000),
      }),
   ],
   providers: [AppCacheService],
   exports: [AppCacheService],
})
export class AppCacheModule {}
