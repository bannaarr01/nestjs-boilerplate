import { Readable } from 'node:stream';
import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageDriver } from '../interfaces/storage-driver.interface';
import { StorageUploadInput, StorageUploadResult } from '../interfaces/storage.types';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class S3StorageDriver implements IStorageDriver {
   private readonly bucketName: string;
   private readonly s3Client: S3Client;

   constructor() {
      this.bucketName = process.env.S3_BUCKET_NAME || '';

      if (!this.bucketName) {
         throw new Error('S3_BUCKET_NAME is required when STORAGE_PROVIDER=s3');
      }

      this.s3Client = new S3Client({
         region: process.env.AWS_REGION || 'us-east-1',
         credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
           ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
           }
           : undefined
      });
   }

   async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
      await this.s3Client.send(
         new PutObjectCommand({
            Bucket: this.bucketName,
            Key: input.key,
            Body: input.buffer,
            ContentType: input.contentType,
            Metadata: input.metadata
         })
      );

      const checksum = createHash('sha256').update(input.buffer).digest('hex');

      return {
         key: input.key,
         checksum,
         size: input.buffer.byteLength
      };
   }

   async delete(key: string): Promise<void> {
      await this.s3Client.send(
         new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key
         })
      );
   }

   async getSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
      return getSignedUrl(
         this.s3Client,
         new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key
         }),
         { expiresIn: expiresInSeconds }
      );
   }

   async getFileBuffer(key: string): Promise<Buffer> {
      const output = await this.s3Client.send(
         new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key
         })
      );

      const body = output.Body;

      if (!body) {
         throw new Error(`No data found for key: ${key}`);
      }

      if (body instanceof Readable) {
         const chunks: Buffer[] = [];
         for await (const chunk of body) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
         }
         return Buffer.concat(chunks);
      }

      if (typeof (body as any).transformToByteArray === 'function') {
         const arrayBuffer = await (body as any).transformToByteArray();
         return Buffer.from(arrayBuffer);
      }

      throw new Error(`Unsupported S3 response body type for key: ${key}`);
   }
}


