export function parseBooleanEnv(value: string | undefined, defaultValue: boolean = false): boolean {
   if (value === undefined || value === null || value === '') {
      return defaultValue;
   }

   const normalized = value.toLowerCase();

   if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
   }

   if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
   }

   return defaultValue;
}

export function isDevelopment(): boolean {
   const nodeEnv = process.env.NODE_ENV?.toLowerCase();
   return nodeEnv === 'development' || nodeEnv === 'dev';
}

export function isProduction(): boolean {
   const nodeEnv = process.env.NODE_ENV?.toLowerCase();
   return nodeEnv === 'production' || nodeEnv === 'prod';
}

export function isStaging(): boolean {
   const nodeEnv = process.env.NODE_ENV?.toLowerCase();
   return nodeEnv === 'staging' || nodeEnv === 'stg';
}

export function getEnvironment(): string {
   return process.env.NODE_ENV || 'unknown';
}

export function isRedisEnabled(): boolean {
   return parseBooleanEnv(process.env.REDIS_ENABLED, false);
}

type AuthProvider = 'keycloak' | 'none';

export function getAuthProvider(): AuthProvider {
   const value = (process.env.AUTH_PROVIDER || 'none').toLowerCase();
   if (value === 'keycloak') return 'keycloak';
   return 'none';
}

export function isKeycloakEnabled(): boolean {
   return getAuthProvider() === 'keycloak';
}
