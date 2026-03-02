import Winston from 'winston';
import { MikroORM } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { parseBooleanEnv } from '../../utils/env.util';
import { LoggingService } from '../../logging/logging.service';
import { ErrorHandlerService } from '../../common/services/error-handler.service';

@Injectable()
export class DbMigrationService {
   private readonly log: Winston.Logger;
   private readonly ctx = DbMigrationService.name;

   constructor(
    private readonly orm: MikroORM,
    private readonly logger: LoggingService,
    private readonly errorHandler: ErrorHandlerService
   ) {
      this.log = this.logger.getLogger();
   }

   async runMigrations(): Promise<void> {
      try {
         const migrator = this.orm.getMigrator();
         const pendingMigrations = await migrator.getPendingMigrations();

         if (pendingMigrations.length > 0) {
            this.log.info(`Applying ${pendingMigrations.length} pending migration(s).`, {
               label: `${this.ctx}.runMigrations`
            });

            await this.applyMigration();
            return;
         }

         const shouldCheckSchemaDiff = parseBooleanEnv(process.env.DB_VERIFY_MIGRATION_DIFF, false);

         if (!shouldCheckSchemaDiff) {
            this.log.info('Migration is up to date. Schema diff check skipped (DB_VERIFY_MIGRATION_DIFF=false).', {
               label: `${this.ctx}.runMigrations`
            });
            return;
         }

         const schemaNeedsMigration = await migrator.checkMigrationNeeded();
         if (schemaNeedsMigration) {
            this.log.warn('Schema has changes with no migration file. Run db:migration:create.', {
               label: `${this.ctx}.runMigrations`
            });
            return;
         }

         this.log.info('Migration is up to date.', {
            label: `${this.ctx}.runMigrations`
         });
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, DbMigrationService, '.runMigrations');
      }
   }

   async applyMigration(): Promise<void> {
      try {
         await this.orm.getMigrator().up();

         this.log.info('Migrations completed.', {
            label: `${this.ctx}.applyMigration`
         });
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, DbMigrationService, '.applyMigration');
      }
   }

   async createMigration(): Promise<void> {
      try {
         await this.orm.getMigrator().createMigration();

         this.log.info('Migration file created.', {
            label: `${this.ctx}.createMigration`
         });
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, DbMigrationService, '.createMigration');
      }
   }
}


