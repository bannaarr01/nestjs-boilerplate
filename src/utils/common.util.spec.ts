import { Request } from 'express';
import { CommonUtils } from './common.util';

describe('CommonUtils', () => {
   describe('isArray', () => {
      it('should return true for a non-empty array', () => {
         expect(CommonUtils.isArray([1, 2, 3])).toBe(true);
      });

      it('should return false for an empty array', () => {
         expect(CommonUtils.isArray([])).toBe(false);
      });

      it('should return false for null, undefined, and string', () => {
         expect(CommonUtils.isArray(null)).toBe(false);
         expect(CommonUtils.isArray(undefined)).toBe(false);
         expect(CommonUtils.isArray('hello')).toBe(false);
      });
   });

   describe('joinUrl', () => {
      it('should join simple URL parts', () => {
         expect(CommonUtils.joinUrl('https://example.com', 'api', 'v1'))
            .toBe('https://example.com/api/v1');
      });

      it('should remove trailing and leading slashes from parts', () => {
         expect(CommonUtils.joinUrl('https://example.com/', '/api/', '/v1'))
            .toBe('https://example.com/api/v1');
      });

      it('should throw on undefined part', () => {
         expect(() => CommonUtils.joinUrl('https://example.com', undefined as any))
            .toThrow('URL part is undefined or null and cannot be joined.');
      });

      it('should throw on empty string part', () => {
         expect(() => CommonUtils.joinUrl('https://example.com', '  '))
            .toThrow('URL part is an empty string and cannot be joined.');
      });
   });

   describe('sanitizeFilename', () => {
      it('should replace special characters with underscores', () => {
         expect(CommonUtils.sanitizeFilename('hello world!.pdf')).toBe('hello_world_.pdf');
         expect(CommonUtils.sanitizeFilename('my file@#$.txt')).toBe('my_file___.txt');
      });

      it('should truncate to 255 characters', () => {
         const longName = 'a'.repeat(300) + '.txt';
         expect(CommonUtils.sanitizeFilename(longName).length).toBe(255);
      });
   });

   describe('sanitizeInput', () => {
      it('should strip script tags', () => {
         expect(CommonUtils.sanitizeInput('<script>alert("xss")</script>hello'))
            .toBe('hello');
      });

      it('should strip HTML tags', () => {
         expect(CommonUtils.sanitizeInput('<b>bold</b> text'))
            .toBe('bold text');
      });

      it('should strip javascript: protocol', () => {
         expect(CommonUtils.sanitizeInput('javascript:alert(1)'))
            .toBe('alert(1)');
      });

      it('should return empty string for falsy input', () => {
         expect(CommonUtils.sanitizeInput('')).toBe('');
         expect(CommonUtils.sanitizeInput(null as any)).toBe('');
         expect(CommonUtils.sanitizeInput(undefined as any)).toBe('');
      });
   });

   describe('parseIds', () => {
      it('should parse comma-separated IDs', () => {
         expect(CommonUtils.parseIds('1,2,3')).toEqual([1, 2, 3]);
      });

      it('should filter out non-positive and NaN values', () => {
         expect(CommonUtils.parseIds('1,-2,abc,3')).toEqual([1, 3]);
      });

      it('should return empty array for undefined', () => {
         expect(CommonUtils.parseIds(undefined)).toEqual([]);
      });
   });

   describe('getClientIp', () => {
      const originalEnv = process.env.TRUST_PROXY;

      afterEach(() => {
         if (originalEnv === undefined) {
            delete process.env.TRUST_PROXY;
         } else {
            process.env.TRUST_PROXY = originalEnv;
         }
      });

      it('should return x-forwarded-for first IP when TRUST_PROXY is true', () => {
         process.env.TRUST_PROXY = 'true';
         const req = {
            headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2' },
            ip: '127.0.0.1',
            socket: { remoteAddress: '127.0.0.1' },
         } as unknown as Request;

         expect(CommonUtils.getClientIp(req)).toBe('10.0.0.1');
      });

      it('should return request.ip when TRUST_PROXY is false even if forwarded header exists', () => {
         process.env.TRUST_PROXY = 'false';
         const req = {
            headers: { 'x-forwarded-for': '10.0.0.1' },
            ip: '192.168.1.1',
            socket: { remoteAddress: '127.0.0.1' },
         } as unknown as Request;

         expect(CommonUtils.getClientIp(req)).toBe('192.168.1.1');
      });

      it('should return unknown as fallback', () => {
         process.env.TRUST_PROXY = 'false';
         const req = {
            headers: {},
            ip: undefined,
            socket: { remoteAddress: undefined },
         } as unknown as Request;

         expect(CommonUtils.getClientIp(req)).toBe('unknown');
      });
   });
});
