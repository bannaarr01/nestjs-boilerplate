import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { CommonModule } from '../common/common.module';
import { STORAGE_DRIVER_TOKEN } from './storage.constants';
import { S3StorageDriver } from './drivers/s3-storage.driver';
import { LocalStorageDriver } from './drivers/local-storage.driver';

@Module({
   imports: [CommonModule],
   providers: [
      {
         provide: STORAGE_DRIVER_TOKEN,
         useFactory: () => {
            const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

            if (provider === 's3') {
               return new S3StorageDriver();
            }

            return new LocalStorageDriver();
         }
      },
      StorageService
   ],
   exports: [StorageService]
})
export class StorageModule {}


