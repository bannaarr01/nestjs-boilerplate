import * as dotenv from 'dotenv';

dotenv.config({ quiet: true });

import { Options } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { Migrator } from '@mikro-orm/migrations';
import { SeedManager } from '@mikro-orm/seeder';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { CustomMigrationGenerator } from '../../database/migrations/custom-migration.generator';

type SupportedDbClient = 'postgresql' | 'mysql';

function normalizeDbClient(value?: string): SupportedDbClient {
   const normalizedValue = (value || 'postgresql').toLowerCase();

   if (['postgres', 'postgresql', 'pg'].includes(normalizedValue)) {
      return 'postgresql';
   }

   if (['mysql', 'mariadb'].includes(normalizedValue)) {
      return 'mysql';
   }

   throw new Error(
      `Unsupported DB_CLIENT: ${value}. Use one of: postgres, postgresql, pg, mysql, mariadb`
   );
}

const dbClient = normalizeDbClient(process.env.DB_CLIENT);
const isTest = process.env.NODE_ENV === 'test' || process.env.DB_DISABLE_CONNECT === 'true';
const isPostgreSqlClient = dbClient === 'postgresql';

function resolveDbValue(key: 'name' | 'user' | 'pass' | 'host', fallback: string): string {
   const upperKey = key.toUpperCase();

   return process.env[`DB_${upperKey}`] || fallback;
}

function resolveDbPort(): number {
   const overridePort = process.env.DB_PORT;
   if (overridePort) {
      return Number(overridePort);
   }

   return isPostgreSqlClient ? 5432 : 3306;
}

function resolveDbHost(): string {
   const host = resolveDbValue('host', '127.0.0.1').trim();

   // Prefer IPv4 loopback to avoid localhost/IPv6 resolver edge-cases on some systems.
   return host === 'localhost' ? '127.0.0.1' : host;
}

function toPositiveInteger(value: string | undefined, fallback: number, minimum: number = 0): number {
   const parsed = Number(value);
   if (!Number.isFinite(parsed)) {
      return fallback;
   }

   const normalized = Math.floor(parsed);
   return normalized >= minimum ? normalized : fallback;
}

function resolvePoolConfig(): {
   min: number;
   max: number;
   acquireTimeoutMillis: number;
   createTimeoutMillis: number;
   idleTimeoutMillis: number;
   } {
   const min = toPositiveInteger(process.env.DB_POOL_MIN, 0, 0);
   const max = toPositiveInteger(process.env.DB_POOL_MAX, 10, 1);
   const acquireTimeoutMillis = toPositiveInteger(process.env.DB_POOL_ACQUIRE_TIMEOUT_MS, 10000, 1000);
   const createTimeoutMillis = toPositiveInteger(process.env.DB_POOL_CREATE_TIMEOUT_MS, 5000, 1000);
   const idleTimeoutMillis = toPositiveInteger(process.env.DB_POOL_IDLE_TIMEOUT_MS, 30000, 1000);

   return {
      min: Math.min(min, max),
      max,
      acquireTimeoutMillis,
      createTimeoutMillis,
      idleTimeoutMillis
   };
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
   if (!value) {
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

function resolvePostgreSqlSchema(): string {
   const schema = process.env.DB_SCHEMA;

   if (schema && schema.trim().length > 0) {
      return schema.trim();
   }

   if (isTest) {
      return 'public';
   }

   throw new Error('DB_SCHEMA is required when DB_CLIENT=postgresql');
}

const commonConfig: Partial<Options> = {
   dbName: resolveDbValue('name', 'nestjs_boilerplate'),
   user: resolveDbValue('user', isPostgreSqlClient ? 'postgres' : 'root'),
   password: resolveDbValue('pass', isPostgreSqlClient ? 'postgres' : 'root'),
   host: resolveDbHost(),
   debug: parseBoolean(process.env.DB_DEBUG, false),
   connect: !isTest,
   allowGlobalContext: isTest,
   pool: resolvePoolConfig(),
   metadataProvider: TsMorphMetadataProvider,
   entities: ['./dist/**/*.entity.js'],
   entitiesTs: ['src/**/*.entity.ts'],
   extensions: [SeedManager, Migrator],
   migrations: {
      tableName: process.env.DB_MIGRATIONS_TABLE || 'mikro_orm_migrations',
      glob: '!(*.d).{js,ts}',
      path: process.env.DB_MIGRATIONS_PATH || 'dist/migrations',
      pathTs: process.env.DB_MIGRATIONS_PATH_TS || 'migrations',
      transactional: isPostgreSqlClient,
      allOrNothing: isPostgreSqlClient,
      safe: true,
      emit: 'ts',
      generator: CustomMigrationGenerator
   },
   seeder: {
      path: 'dist/database/seeders',
      pathTs: 'src/database/seeders',
      glob: '!(*.d).{js,ts}',
      defaultSeeder: 'DatabaseSeeder'
   }
};

const config: Options = {
   ...commonConfig,
   ...(isPostgreSqlClient
      ? {
         driver: PostgreSqlDriver,
         port: resolveDbPort(),
         schema: resolvePostgreSqlSchema(),
         driverOptions: {
            connection: {
               ssl: parseBoolean(process.env.DB_SSL, false)
                  ? {
                     rejectUnauthorized: false
                  }
                  : false
            }
         }
      }
      : {
         driver: MySqlDriver,
         port: resolveDbPort()
      })
} as Options;

export default config;
