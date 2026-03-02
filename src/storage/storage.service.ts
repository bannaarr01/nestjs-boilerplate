import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_DRIVER_TOKEN } from './storage.constants';
import { StorageUploadResult } from './interfaces/storage.types';
import { IStorageDriver } from './interfaces/storage-driver.interface';
import { ErrorHandlerService } from '../common/services/error-handler.service';

@Injectable()
export class StorageService {
   constructor(
    @Inject(STORAGE_DRIVER_TOKEN)
    private readonly storageDriver: IStorageDriver,
    private readonly errorHandler: ErrorHandlerService
   ) {}

   async uploadBuffer(
      key: string,
      buffer: Buffer,
      contentType: string,
      metadata?: Record<string, string>
   ): Promise<StorageUploadResult> {
      try {
         return await this.storageDriver.upload({
            key,
            buffer,
            contentType,
            metadata
         });
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, StorageService, '.uploadBuffer');
      }
   }

   async deleteFile(key: string): Promise<void> {
      try {
         await this.storageDriver.delete(key);
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, StorageService, '.deleteFile');
      }
   }

   async getSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
      try {
         return await this.storageDriver.getSignedUrl(key, expiresInSeconds);
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, StorageService, '.getSignedUrl');
      }
   }

   async getFileBuffer(key: string): Promise<Buffer> {
      try {
         return await this.storageDriver.getFileBuffer(key);
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, StorageService, '.getFileBuffer');
      }
   }

   generateStorageKey(entityType: string, originalFileName: string, id: string = randomUUID()): string {
      const extension = extname(originalFileName) || '';
      const sanitizedEntity = entityType.replace(/[^a-zA-Z0-9/_-]/g, '_');
      return `${sanitizedEntity}/${id}${extension}`;
   }
}


