import { getEnvironment, isDevelopment, isProduction, isStaging, parseBooleanEnv } from './env.util';

describe('env util', () => {
   const originalNodeEnv = process.env.NODE_ENV;

   afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
   });

   it('detects development aliases', () => {
      process.env.NODE_ENV = 'development';
      expect(isDevelopment()).toBe(true);

      process.env.NODE_ENV = 'dev';
      expect(isDevelopment()).toBe(true);
   });

   it('detects production aliases', () => {
      process.env.NODE_ENV = 'production';
      expect(isProduction()).toBe(true);

      process.env.NODE_ENV = 'prod';
      expect(isProduction()).toBe(true);
   });

   it('detects staging aliases', () => {
      process.env.NODE_ENV = 'staging';
      expect(isStaging()).toBe(true);

      process.env.NODE_ENV = 'stg';
      expect(isStaging()).toBe(true);
   });

   it('returns unknown when NODE_ENV is not set', () => {
      delete process.env.NODE_ENV;
      expect(getEnvironment()).toBe('unknown');
   });

   it('parses boolean env values', () => {
      expect(parseBooleanEnv('true')).toBe(true);
      expect(parseBooleanEnv('1')).toBe(true);
      expect(parseBooleanEnv('on')).toBe(true);
      expect(parseBooleanEnv('false')).toBe(false);
      expect(parseBooleanEnv('0')).toBe(false);
      expect(parseBooleanEnv('off')).toBe(false);
      expect(parseBooleanEnv(undefined, true)).toBe(true);
   });
});


