import { Request } from 'express';
import { cwd } from 'node:process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { plainToInstance } from 'class-transformer';

interface ClassConstructor<T> {
  new (...args: any[]): T;
}

export class CommonUtils {
   static serializeToDto<T>(dto: ClassConstructor<T>, data: any): T | T[] {
      return plainToInstance(dto, data, {
         excludeExtraneousValues: true
      });
   }

   static readonly isArray = (value: any): value is any[] => {
      return Array.isArray(value) && value.length > 0;
   };

   static joinUrl(...parts: (string | undefined | null)[]): string {
      const cleanedParts: string[] = [];

      for (const part of parts) {
         if (part === undefined || part === null) {
            throw new Error('URL part is undefined or null and cannot be joined.');
         }

         if (typeof part !== 'string') {
            throw new Error(`URL part ${String(part)} is not a string and cannot be joined.`);
         }

         const trimmed = part.trim();
         if (trimmed === '') {
            throw new Error('URL part is an empty string and cannot be joined.');
         }

         cleanedParts.push(trimmed);
      }

      return cleanedParts
         .map((part, index) => {
            if (index === 0) {
               return this.removeTrailingSlashes(part);
            }

            return this.removeLeadingAndTrailingSlashes(part);
         })
         .join('/');
   }

   static loadMailTemplate(fileName: string): string {
      const fullPath = join(resolve(cwd(), 'mail-templates', fileName));
      return readFileSync(fullPath, 'utf-8');
   }

   static sanitizeFilename(filename: string): string {
      return filename.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.{2,}/g, '.').substring(0, 255);
   }

   static sanitizeInput(input: string): string {
      if (!input) {
         return '';
      }

      return input
         .replace(/<script[^>]*>.*?<\/script>/gi, '')
         .replace(/<[^>]+>/g, '')
         .replace(/javascript:/gi, '')
         .trim()
         .substring(0, 1000);
   }

   static parseIds(idString?: string): number[] {
      if (!idString) {
         return [];
      }

      return idString
         .split(',')
         .map(id => Number.parseInt(id.trim(), 10))
         .filter(id => !Number.isNaN(id) && id > 0);
   }

   static getClientIp(request: Request): string {
      const forwarded = request.headers['x-forwarded-for'];
      if (forwarded) {
         return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
      }

      const realIp = request.headers['x-real-ip'];
      if (realIp) {
         return Array.isArray(realIp) ? realIp[0] : realIp;
      }

      return request.ip || request.socket.remoteAddress || 'unknown';
   }

   private static removeTrailingSlashes(str: string): string {
      let end = str.length;
      while (end > 0 && str[end - 1] === '/') {
         end -= 1;
      }

      return str.slice(0, end);
   }

   private static removeLeadingAndTrailingSlashes(str: string): string {
      let start = 0;
      let end = str.length;

      while (start < end && str[start] === '/') {
         start += 1;
      }

      while (end > start && str[end - 1] === '/') {
         end -= 1;
      }

      return str.slice(start, end);
   }
}


