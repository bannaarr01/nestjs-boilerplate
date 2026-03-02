import Redis from 'ioredis';
import { MikroORM } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { isRedisEnabled } from './utils/env.util';
import { AppInfoDto } from './app/dto/app-info.dto';
import { getRedisConnection } from './config/redis/redis.config';
import { ReadinessCheckDto } from './app/dto/readiness-check.dto';

@Injectable()
export class AppService {
   private readonly exposeDependencyErrors = (process.env.NODE_ENV || '').toLowerCase() !== 'production';

   constructor(private readonly orm: MikroORM) {}

   getInfo(): AppInfoDto {
      const appName = process.env.APP_NAME || process.env.npm_package_name || 'nestjs-app';

      return {
         name: appName,
         version: process.env.npm_package_version || '1.0.0',
         dbClient: process.env.DB_CLIENT || 'postgresql',
         redisEnabled: isRedisEnabled()
      };
   }

   async getReadiness(): Promise<ReadinessCheckDto> {
      const dependencies: ReadinessCheckDto['dependencies'] = [];

      // Database readiness
      try {
         await this.orm.em.getConnection().execute('select 1');
         dependencies.push({
            name: 'database',
            healthy: true,
            status: 'up'
         });
      } catch (error) {
         dependencies.push({
            name: 'database',
            healthy: false,
            status: 'down',
            message: this.exposeDependencyErrors ? (error as Error).message : 'Database is unavailable'
         });
      }

      // Redis readiness (optional)
      if (!isRedisEnabled()) {
         dependencies.push({
            name: 'redis',
            healthy: true,
            status: 'disabled'
         });
      } else {
         let client: Redis | undefined;
         try {
            client = new Redis({
               ...getRedisConnection(),
               lazyConnect: true,
               maxRetriesPerRequest: 1
            });
            await client.connect();
            const ping = await client.ping();

            dependencies.push({
               name: 'redis',
               healthy: ping === 'PONG',
               status: ping === 'PONG' ? 'up' : 'down'
            });
         } catch (error) {
            dependencies.push({
               name: 'redis',
               healthy: false,
               status: 'down',
               message: this.exposeDependencyErrors ? (error as Error).message : 'Redis is unavailable'
            });
         } finally {
            if (client) {
               await client.quit();
            }
         }
      }

      return {
         status: dependencies.every(item => item.healthy || item.status === 'disabled') ? 'ok' : 'degraded',
         timestamp: new Date().toISOString(),
         dependencies
      };
   }
}
