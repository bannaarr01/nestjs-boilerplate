import { promises as fs } from 'node:fs';
import { Injectable } from '@nestjs/common';
import { dirname, resolve, sep } from 'node:path';
import { createHash, createHmac } from 'node:crypto';
import { IStorageDriver } from '../interfaces/storage-driver.interface';
import { StorageUploadInput, StorageUploadResult } from '../interfaces/storage.types';

@Injectable()
export class LocalStorageDriver implements IStorageDriver {
   private readonly root = process.env.STORAGE_LOCAL_ROOT || 'storage-data';
   private readonly rootPath = resolve(process.cwd(), this.root);

   async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
      const absoluteKeyPath = this.resolvePath(input.key);
      await fs.mkdir(dirname(absoluteKeyPath), { recursive: true });
      await fs.writeFile(absoluteKeyPath, input.buffer);

      const checksum = createHash('sha256').update(input.buffer).digest('hex');

      return {
         key: input.key,
         checksum,
         size: input.buffer.byteLength
      };
   }

   async delete(key: string): Promise<void> {
      const absoluteKeyPath = this.resolvePath(key);

      try {
         await fs.unlink(absoluteKeyPath);
      } catch {
      // Ignore missing local files on delete.
      }
   }

   async getSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
      const baseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 8080}`;
      const signingSecret = process.env.ATTACHMENT_URL_SIGNING_SECRET;

      if (!signingSecret) {
         throw new Error('ATTACHMENT_URL_SIGNING_SECRET is required when STORAGE_PROVIDER=local');
      }

      const encodedKey = encodeURIComponent(key);
      const expiresAt = Date.now() + expiresInSeconds * 1000;
      const payload = `${key}:${expiresAt}`;
      const sig = createHmac('sha256', signingSecret).update(payload).digest('hex');

      return `${baseUrl}/api/v1/attachments/files/${encodedKey}?expires=${expiresAt}&sig=${sig}`;
   }

   async getFileBuffer(key: string): Promise<Buffer> {
      const absoluteKeyPath = this.resolvePath(key);
      return fs.readFile(absoluteKeyPath);
   }

   private resolvePath(key: string): string {
      const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
      const sanitizedKey = normalizedKey
         .split('/')
         .filter(segment => segment && segment !== '.' && segment !== '..')
         .join('/');

      const resolvedPath = resolve(this.rootPath, sanitizedKey);
      const normalizedRootPath = this.rootPath.endsWith(sep) ? this.rootPath : `${this.rootPath}${sep}`;

      if (resolvedPath !== this.rootPath && !resolvedPath.startsWith(normalizedRootPath)) {
         throw new Error('Invalid storage key path');
      }

      return resolvedPath;
   }
}

