import { EntityManager } from '@mikro-orm/core';
import { readFile, unlink } from 'node:fs/promises';
import { HttpStatus, Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { StorageService } from '../storage/storage.service';
import { CustomError } from '../common/classes/custom-error';
import { LocalFileQuery } from './types/local-file-query.type';
import { AttachmentEntity } from './entities/attachment.entity';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { AttachmentResponseDto } from './dto/attachment-response.dto';
import { Auditable } from '../common/embeddables/auditable.embeddable';
import { ErrorHandlerService } from '../common/services/error-handler.service';

const DEFAULT_URL_EXPIRY_SECONDS = 3600;
const DEFAULT_ALLOWED_MIME_TYPES = [
   'application/pdf',
   'application/msword',
   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
   'image/jpeg',
   'image/jpg',
   'image/png',
   'image/heic',
   'image/heif'
];

@Injectable()
export class AttachmentService {
   constructor(
    private readonly entityManager: EntityManager,
    private readonly storageService: StorageService,
    private readonly errorHandler: ErrorHandlerService
   ) {}

   async uploadAttachment(
      file: Express.Multer.File,
      uploadDto: UploadAttachmentDto,
      createdBy?: string
   ): Promise<AttachmentResponseDto> {
      let storageKey = '';

      try {
         const fileBuffer = await this.resolveFileBuffer(file);
         this.validateFile(file, fileBuffer);

         storageKey = this.storageService.generateStorageKey(uploadDto.entityType, file.originalname);

         const uploadResult = await this.storageService.uploadBuffer(
            storageKey,
            fileBuffer,
            file.mimetype,
            {
               entityType: uploadDto.entityType,
               entityId: uploadDto.entityId
            }
         );

         try {
            const attachment = this.entityManager.create(AttachmentEntity, {
               entityType: uploadDto.entityType,
               entityId: uploadDto.entityId,
               originalFileName: file.originalname,
               storageKey,
               mimeType: file.mimetype,
               fileSize: file.size,
               checksum: uploadResult.checksum,
               description: uploadDto.description,
               metadata: uploadDto.metadata,
               audit: new Auditable(createdBy)
            });

            await this.entityManager.persistAndFlush(attachment);

            return this.toResponseDto(attachment, uploadDto.urlExpiresInSeconds);
         } catch (error) {
            await this.safeDeleteFile(storageKey);
            throw error;
         }
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, AttachmentService, '.uploadAttachment');
      } finally {
         await this.cleanupTempFile(file?.path);
      }
   }

   async getAttachmentById(id: string, expiresInSeconds?: number): Promise<AttachmentResponseDto> {
      try {
         const attachment = await this.entityManager.findOne(AttachmentEntity, { uuid: id });

         if (!attachment) {
            throw new CustomError('Attachment not found', HttpStatus.NOT_FOUND);
         }

         return this.toResponseDto(attachment, expiresInSeconds);
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, AttachmentService, '.getAttachmentById');
      }
   }

   async listAttachmentsByEntity(
      entityType: string,
      entityId: string,
      expiresInSeconds?: number
   ): Promise<AttachmentResponseDto[]> {
      try {
         const attachments = await this.entityManager.find(
            AttachmentEntity,
            { entityType, entityId },
            {
               orderBy: { audit: { createdAt: 'DESC' } }
            }
         );

         return Promise.all(attachments.map(attachment => this.toResponseDto(attachment, expiresInSeconds)));
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, AttachmentService, '.listAttachmentsByEntity');
      }
   }

   async deleteAttachmentById(id: string): Promise<void> {
      try {
         const attachment = await this.entityManager.findOne(AttachmentEntity, { uuid: id });

         if (!attachment) {
            throw new CustomError('Attachment not found', HttpStatus.NOT_FOUND);
         }

         await this.entityManager.removeAndFlush(attachment);
         await this.safeDeleteFile(attachment.storageKey);
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, AttachmentService, '.deleteAttachmentById');
      }
   }

   async getLocalFileBuffer(encodedKey: string, query: LocalFileQuery): Promise<Buffer> {
      try {
         const storageProvider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

         if (storageProvider !== 'local') {
            throw new CustomError(
               'Local file endpoint is only available when STORAGE_PROVIDER=local',
               HttpStatus.BAD_REQUEST
            );
         }

         const key = decodeURIComponent(encodedKey);
         this.validateLocalFileAccess(key, query);

         return this.storageService.getFileBuffer(key);
      } catch (error) {
         throw this.errorHandler.handleServiceError(error, AttachmentService, '.getLocalFileBuffer');
      }
   }

   private validateLocalFileAccess(key: string, query: LocalFileQuery): void {
      const expires = query.expires;
      const signature = query.sig;
      const signingSecret = process.env.ATTACHMENT_URL_SIGNING_SECRET;

      if (!expires || !signature) {
         throw new CustomError('Attachment URL is missing required signature data', HttpStatus.UNAUTHORIZED);
      }

      if (!signingSecret) {
         throw new CustomError('ATTACHMENT_URL_SIGNING_SECRET is not configured', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const expiresAt = Number(expires);

      if (Number.isNaN(expiresAt) || Date.now() > expiresAt) {
         throw new CustomError('Attachment URL is expired', HttpStatus.GONE);
      }

      const payload = `${key}:${expiresAt}`;
      const expectedSignature = createHmac('sha256', signingSecret).update(payload).digest('hex');
      const providedBuffer = Buffer.from(signature, 'utf8');
      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

      if (
         providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
      ) {
         throw new CustomError('Attachment URL signature is invalid', HttpStatus.UNAUTHORIZED);
      }
   }

   private validateFile(file: Express.Multer.File | undefined, fileBuffer: Buffer): void {
      if (!file) {
         throw new CustomError('File is required', HttpStatus.BAD_REQUEST);
      }

      if ((!file.buffer || file.buffer.byteLength === 0) && !file.path) {
         throw new CustomError('Uploaded file is empty', HttpStatus.BAD_REQUEST);
      }

      const allowedMimeTypes = this.getAllowedMimeTypes();
      const detectedMimeType = this.detectMimeType(fileBuffer);

      if (!allowedMimeTypes.includes(file.mimetype)) {
         throw new CustomError(
            `Unsupported file type: ${file.mimetype}. Allowed: ${allowedMimeTypes.join(', ')}`,
            HttpStatus.BAD_REQUEST
         );
      }

      if (!detectedMimeType) {
         throw new CustomError('Unable to validate file signature', HttpStatus.BAD_REQUEST);
      }

      if (!this.isMimeCompatible(file.mimetype, detectedMimeType)) {
         throw new CustomError(
            `File content does not match declared MIME type (${file.mimetype}). Detected: ${detectedMimeType}`,
            HttpStatus.BAD_REQUEST
         );
      }
   }

   private getAllowedMimeTypes(): string[] {
      const value = process.env.ATTACHMENT_ALLOWED_MIME_TYPES;

      if (!value) {
         return DEFAULT_ALLOWED_MIME_TYPES;
      }

      const parsed = value
         .split(',')
         .map(item => item.trim())
         .filter(Boolean);

      return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_MIME_TYPES;
   }

   private async toResponseDto(
      attachment: AttachmentEntity,
      expiresInSeconds: number = DEFAULT_URL_EXPIRY_SECONDS
   ): Promise<AttachmentResponseDto> {
      const signedUrl = await this.storageService.getSignedUrl(attachment.storageKey, expiresInSeconds);

      return {
         id: attachment.uuid,
         entityType: attachment.entityType,
         entityId: attachment.entityId,
         originalFileName: attachment.originalFileName,
         storageKey: attachment.storageKey,
         mimeType: attachment.mimeType,
         fileSize: attachment.fileSize,
         checksum: attachment.checksum,
         description: attachment.description,
         metadata: attachment.metadata,
         createdAt: attachment.audit.createdAt.toISOString(),
         signedUrl
      };
   }

   private async safeDeleteFile(storageKey: string): Promise<void> {
      if (!storageKey) {
         return;
      }

      try {
         await this.storageService.deleteFile(storageKey);
      } catch {
      // Suppress rollback failures to preserve the primary error path.
      }
   }

   private async resolveFileBuffer(file: Express.Multer.File): Promise<Buffer> {
      if (file.buffer?.byteLength) {
         return file.buffer;
      }

      if (file.path) {
         return readFile(file.path);
      }

      throw new CustomError('Uploaded file payload is unavailable', HttpStatus.BAD_REQUEST);
   }

   private async cleanupTempFile(path?: string): Promise<void> {
      if (!path) {
         return;
      }

      try {
         await unlink(path);
      } catch {
      // Ignore cleanup failures for temporary upload files.
      }
   }

   private detectMimeType(fileBuffer: Buffer): string | null {
      if (fileBuffer.length >= 5 && fileBuffer.subarray(0, 5).toString('ascii') === '%PDF-') {
         return 'application/pdf';
      }

      if (fileBuffer.length >= 8) {
         const pngSignature = '89504e470d0a1a0a';
         if (fileBuffer.subarray(0, 8).toString('hex') === pngSignature) {
            return 'image/png';
         }
      }

      if (fileBuffer.length >= 3) {
         const jpegPrefix = fileBuffer.subarray(0, 3).toString('hex');
         if (jpegPrefix === 'ffd8ff') {
            return 'image/jpeg';
         }
      }

      if (fileBuffer.length >= 8) {
         const docSignature = 'd0cf11e0a1b11ae1';
         if (fileBuffer.subarray(0, 8).toString('hex') === docSignature) {
            return 'application/msword';
         }
      }

      if (this.isDocx(fileBuffer)) {
         return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }

      const heicType = this.detectHeicType(fileBuffer);
      if (heicType) {
         return heicType;
      }

      return null;
   }

   private isDocx(fileBuffer: Buffer): boolean {
      if (fileBuffer.length < 4 || fileBuffer.subarray(0, 4).toString('hex') !== '504b0304') {
         return false;
      }

      const header = fileBuffer.subarray(0, 8192).toString('latin1');
      return header.includes('[Content_Types].xml') && header.includes('word/');
   }

   private detectHeicType(fileBuffer: Buffer): string | null {
      if (fileBuffer.length < 12) {
         return null;
      }

      const boxType = fileBuffer.subarray(4, 8).toString('ascii');
      if (boxType !== 'ftyp') {
         return null;
      }

      const majorBrand = fileBuffer.subarray(8, 12).toString('ascii').toLowerCase();

      if (['heic', 'heix', 'hevc', 'hevx'].includes(majorBrand)) {
         return 'image/heic';
      }

      if (['mif1', 'msf1'].includes(majorBrand) || majorBrand.startsWith('heif')) {
         return 'image/heif';
      }

      return null;
   }

   private isMimeCompatible(declaredMimeType: string, detectedMimeType: string): boolean {
      const normalizedDeclared = declaredMimeType.toLowerCase();
      const normalizedDetected = detectedMimeType.toLowerCase();

      if (normalizedDeclared === normalizedDetected) {
         return true;
      }

      if (normalizedDeclared === 'image/jpg' && normalizedDetected === 'image/jpeg') {
         return true;
      }

      return false;
   }
}

