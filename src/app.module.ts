import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { ProxyModule } from './proxy/proxy.module';
import { QueueModule } from './queue/queue.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CommonModule } from './common/common.module';
import { LoggingModule } from './logging/logging.module';
import { StorageModule } from './storage/storage.module';
import { AttachmentModule } from './attachment/attachment.module';
import { AuthConfigModule } from './config/auth/auth-config.module';
import { DbSeederModule } from './database/seeders/db-seeder.module';
import { QueueConfigModule } from './config/queue/queue-config.module';
import { DbMigrationModule } from './database/migrations/db-migration.module';

@Module({
   imports: [
      MikroOrmModule.forRoot(),
      AuthModule,
      CommonModule,
      ProxyModule,
      MailModule,
      StorageModule,
      QueueModule,
      AttachmentModule,
      QueueConfigModule.forRoot(),
      AuthConfigModule.forRoot(),
      LoggingModule,
      DbMigrationModule,
      DbSeederModule
   ],
   controllers: [AppController],
   providers: [AppService]
})
export class AppModule {}
