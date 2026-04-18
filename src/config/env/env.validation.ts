import { normalizeDbClient } from '../../utils/db.util';
import { isProduction, isStaging, parseBooleanEnv } from '../../utils/env.util';

type AuthProvider = 'keycloak' | 'none';
type MailProvider = 'console' | 'sendgrid' | 'smtp' | 'ses';
type StorageProvider = 'local' | 's3';

function requireEnv(name: string): string {
   const value = process.env[name];

   if (!value || value.trim().length === 0) {
      throw new Error(`${name} is required`);
   }

   return value.trim();
}

function parseStorageProvider(value: string | undefined): StorageProvider {
   const normalizedValue = (value || 'local').toLowerCase();

   if (normalizedValue === 'local' || normalizedValue === 's3') {
      return normalizedValue;
   }

   throw new Error(`Unsupported STORAGE_PROVIDER: ${value}`);
}

function parseMailProvider(value: string | undefined): MailProvider {
   const normalizedValue = (value || 'console').toLowerCase();

   if (['console', 'sendgrid', 'smtp', 'ses'].includes(normalizedValue)) {
      return normalizedValue as MailProvider;
   }

   throw new Error(`Unsupported MAIL_PROVIDER: ${value}`);
}

function parseAuthProvider(value: string | undefined): AuthProvider {
   const normalizedValue = (value || 'none').toLowerCase();

   if (normalizedValue === 'keycloak' || normalizedValue === 'none') {
      return normalizedValue;
   }

   throw new Error(`Unsupported AUTH_PROVIDER: ${value}`);
}

function isProductionLike(): boolean {
   return isProduction() || isStaging();
}

function assertStrongSecret(name: string, value: string): void {
   if (value.length < 24) {
      throw new Error(`${name} must be at least 24 characters in production/staging`);
   }

   const normalized = value.toLowerCase();
   if (normalized.includes('change-me') || normalized.includes('example') || normalized.includes('default')) {
      throw new Error(`${name} appears to use an insecure placeholder value`);
   }
}

export function validateEnvironmentOrThrow(): void {
   const apiKey = requireEnv('API_KEY');
   const authProvider = parseAuthProvider(process.env.AUTH_PROVIDER);
   const dbClient = normalizeDbClient(process.env.DB_CLIENT);
   const storageProvider = parseStorageProvider(process.env.STORAGE_PROVIDER);
   const mailProvider = parseMailProvider(process.env.MAIL_PROVIDER);

   if (isProductionLike()) {
      assertStrongSecret('API_KEY', apiKey);
   }

   if (authProvider === 'keycloak') {
      const keycloakBaseUrl = requireEnv('KEYCLOAK_BASE_URL');
      const keycloakRealm = requireEnv('KEYCLOAK_REALM');
      const keycloakClientId = requireEnv('KEYCLOAK_CLIENT_ID');

      if (isProductionLike()) {
         if (keycloakBaseUrl.includes('localhost')) {
            throw new Error('KEYCLOAK_BASE_URL must not use localhost in production/staging');
         }

         if (keycloakRealm === 'master') {
            throw new Error('KEYCLOAK_REALM must use an application realm in production/staging');
         }

         if (keycloakClientId.includes('example') || keycloakClientId.includes('change-me')) {
            throw new Error('KEYCLOAK_CLIENT_ID appears to use an insecure placeholder value');
         }
      }
   }

   if (dbClient === 'postgresql') {
      requireEnv('DB_SCHEMA');
   }

   if (parseBooleanEnv(process.env.REDIS_ENABLED, false)) {
      requireEnv('REDIS_HOST');
      requireEnv('REDIS_PORT');
   }

   if (storageProvider === 'local') {
      const signingSecret = requireEnv('ATTACHMENT_URL_SIGNING_SECRET');

      if (isProductionLike()) {
         assertStrongSecret('ATTACHMENT_URL_SIGNING_SECRET', signingSecret);
      }
   }

   if (storageProvider === 's3') {
      requireEnv('AWS_REGION');
      requireEnv('S3_BUCKET_NAME');
   }

   if (mailProvider === 'sendgrid') {
      requireEnv('SENDGRID_API_KEY');
      requireEnv('MAIL_FROM_ADDRESS');
   }

   if (mailProvider === 'smtp') {
      requireEnv('SMTP_HOST');
      requireEnv('SMTP_PORT');
      requireEnv('MAIL_FROM_ADDRESS');
   }

   if (mailProvider === 'ses') {
      requireEnv('AWS_REGION');

      const emailSource = process.env.EMAIL_SOURCE || process.env.MAIL_FROM_ADDRESS;
      if (!emailSource || emailSource.trim().length === 0) {
         throw new Error('EMAIL_SOURCE or MAIL_FROM_ADDRESS is required when MAIL_PROVIDER=ses');
      }
   }
}
