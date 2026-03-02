import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { DbMigrationService } from './db-migration.service';

@Module({
   imports: [CommonModule],
   providers: [DbMigrationService],
   exports: [DbMigrationService]
})
export class DbMigrationModule {}


