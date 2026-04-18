import { Request } from 'express';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { BadRequestException } from '@nestjs/common';
import { diskStorage, memoryStorage, StorageEngine } from 'multer';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export type MulterConfigOptions = {
  maxFileSize?: number;
  maxFiles?: number;
  allowedMimeTypes?: string[];
  uploadDir?: string;
  storageMode?: 'memory' | 'disk';
};

export class MulterStorageConfig {
   private static readonly DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
   private static readonly DEFAULT_MAX_FILES = 1;
   private static readonly DEFAULT_UPLOAD_DIR = 'data/temp/uploads';

   private static readonly DEFAULT_ALLOWED_MIMES = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/heic',
      'image/heif'
   ];

   static createDiskStorage(options?: Partial<MulterConfigOptions>): StorageEngine {
      const uploadDir = resolve(
         process.cwd(),
         options?.uploadDir || process.env.ATTACHMENT_UPLOAD_TEMP_DIR || this.DEFAULT_UPLOAD_DIR
      );

      return diskStorage({
         destination: (_req: Request, _file: Express.Multer.File, cb) => {
            try {
               if (!existsSync(uploadDir)) {
                  mkdirSync(uploadDir, {
                     recursive: true,
                     mode: 0o750
                  });
               }

               cb(null, uploadDir);
            } catch {
               cb(new BadRequestException('Failed to initialize upload destination'), uploadDir);
            }
         },
         filename: (_req: Request, _file: Express.Multer.File, cb) => {
            cb(null, randomBytes(32).toString('hex'));
         }
      });
   }

   static createFileFilter(allowedMimeTypes?: string[]) {
      const allowedMimes = allowedMimeTypes || this.DEFAULT_ALLOWED_MIMES;

      return (_req: Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
         if (!allowedMimes.includes(file.mimetype)) {
            cb(
               new BadRequestException(
                  `Validation failed: unsupported file type. Allowed: ${allowedMimes.join(', ')}`
               ),
               false
            );
            return;
         }

         cb(null, true);
      };
   }

   static createMulterOptions(options?: MulterConfigOptions): MulterOptions {
      const storageMode = options?.storageMode || (process.env.ATTACHMENT_UPLOAD_STORAGE as 'memory' | 'disk') || 'memory';

      return {
         storage: storageMode === 'disk' ? this.createDiskStorage(options) : memoryStorage(),
         limits: {
            fileSize: options?.maxFileSize || this.DEFAULT_MAX_FILE_SIZE,
            files: options?.maxFiles || this.DEFAULT_MAX_FILES,
            fields: 10,
            headerPairs: 100
         },
         fileFilter: this.createFileFilter(options?.allowedMimeTypes),
         preservePath: false
      };
   }

   static createUploadOptions(maxFileSizeBytes: number = this.DEFAULT_MAX_FILE_SIZE): MulterOptions {
      return this.createMulterOptions({
         maxFileSize: maxFileSizeBytes,
         allowedMimeTypes: this.DEFAULT_ALLOWED_MIMES,
         uploadDir: process.env.ATTACHMENT_UPLOAD_TEMP_DIR || this.DEFAULT_UPLOAD_DIR
      });
   }
}

