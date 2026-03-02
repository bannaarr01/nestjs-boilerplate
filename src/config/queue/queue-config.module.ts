import { BullModule } from '@nestjs/bullmq';
import { isRedisEnabled } from '../../utils/env.util';
import { defaultBullMQOptions } from './queue.config';
import { DynamicModule, Module } from '@nestjs/common';
import { getRedisConnection } from '../redis/redis.config';

@Module({})
export class QueueConfigModule {
   static forRoot(): DynamicModule {
      if (!isRedisEnabled()) {
         return {
            module: QueueConfigModule,
            exports: []
         };
      }

      return {
         module: QueueConfigModule,
         imports: [
            BullModule.forRoot({
               connection: getRedisConnection(),
               defaultJobOptions: defaultBullMQOptions
            })
         ],
         exports: [BullModule]
      };
   }
}


