import { Module } from '@nestjs/common';
import { DbSeederService } from './db-seeder.service';
import { CommonModule } from '../../common/common.module';

@Module({
   imports: [CommonModule],
   providers: [DbSeederService],
   exports: [DbSeederService]
})
export class DbSeederModule {}


