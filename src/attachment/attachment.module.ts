import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CommonModule } from '../common/common.module';
import { AttachmentService } from './attachment.service';
import { StorageModule } from '../storage/storage.module';
import { AttachmentController } from './attachment.controller';
import { AttachmentEntity } from './entities/attachment.entity';

@Module({
   imports: [CommonModule, StorageModule, MikroOrmModule.forFeature([AttachmentEntity])],
   controllers: [AttachmentController],
   providers: [AttachmentService],
   exports: [AttachmentService]
})
export class AttachmentModule {}


