import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { CommonModule } from '../common/common.module';

@Module({
   imports: [CommonModule],
   controllers: [QueueController],
   providers: [QueueService],
   exports: [QueueService]
})
export class QueueModule {}


