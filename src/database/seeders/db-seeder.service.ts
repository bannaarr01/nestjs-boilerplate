import { MikroORM } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { DatabaseSeeder } from './seeds/database.seeder';
import { LoggingService } from '../../logging/logging.service';
import { ErrorHandlerService } from '../../common/services/error-handler.service';

@Injectable()
export class DbSeederService {
   constructor(
    private readonly orm: MikroORM,
    private readonly logger: LoggingService,
    private readonly errorHandler: ErrorHandlerService
   ) {}

   async runSeeder(): Promise<void> {
      this.logger.getLogger().info('Seeder init...', {
         label: `${DbSeederService.name}.runSeeder`
      });

      try {
         await this.orm.getSeeder().seed(DatabaseSeeder);

         this.logger.getLogger().info('Seeder completed.', {
            label: `${DbSeederService.name}.runSeeder`
         });
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, DbSeederService, '.runSeeder');
      }
   }
}


