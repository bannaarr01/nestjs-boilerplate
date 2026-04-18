import * as dotenv from 'dotenv';

dotenv.config({ quiet: true });

import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { Request, Response } from 'express';
import { useContainer } from 'class-validator';
import { parseBooleanEnv } from './utils/env.util';
import { LoggingService } from './logging/logging.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MonitoringService } from './monitoring/monitoring.service';
import { DbSeederService } from './database/seeders/db-seeder.service';
import { validateEnvironmentOrThrow } from './config/env/env.validation';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DbMigrationService } from './database/migrations/db-migration.service';
import { runWithRequestContext, updateRequestContext } from './logging/request-context';
import { INestApplication, Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { CORRELATION_ID_HEADER, resolveCorrelationId, resolveUserId } from './logging/correlation-id.middleware';

function parseCsv(value: string | undefined, fallback: string[]): string[] {
   if (!value) {
      return fallback;
   }

   const parsed = value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

   return parsed.length > 0 ? parsed : fallback;
}

function configureSecurityHeaders(app: INestApplication): void {
   app.getHttpAdapter().getInstance().disable('x-powered-by');
   app.use((_: Request, response: Response, next: () => void) => {
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('X-Frame-Options', 'DENY');
      response.setHeader('Referrer-Policy', 'no-referrer');
      response.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
      next();
   });
}

function configureCors(app: INestApplication): void {
   const corsEnabled = parseBooleanEnv(process.env['CORS_ENABLED'], true);
   if (!corsEnabled) {
      return;
   }

   const allowedOrigins = parseCsv(process.env['CORS_ORIGINS'], ['http://localhost:3000', 'http://localhost:5173']);
   const allowedMethods = parseCsv(
      process.env['CORS_METHODS'],
      ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS']
   );
   const allowedHeaders = parseCsv(
      process.env['CORS_ALLOWED_HEADERS'],
      ['Content-Type', 'Authorization', 'x-api-key']
   );

   const wildcardEnabled = allowedOrigins.includes('*');

   app.enableCors({
      origin: wildcardEnabled
         ? true
         : (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
            if (!origin || allowedOrigins.includes(origin)) {
               callback(null, true);
               return;
            }

            callback(new Error('Origin is not allowed by CORS policy'));
         },
      methods: allowedMethods,
      allowedHeaders,
      credentials: parseBooleanEnv(process.env['CORS_CREDENTIALS'], false)
   });
}

async function bootstrap(): Promise<void> {
   validateEnvironmentOrThrow();

   const port = Number(process.env['PORT'] || 8080);
   const appName = process.env['APP_NAME'] || process.env['npm_package_name'] || 'nestjs-app';
   const appDescription = process.env['APP_DESCRIPTION'] || 'Reusable NestJS starter';

   const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log']
   });

   useContainer(app.select(AppModule), { fallbackOnErrors: true });
   app.enableShutdownHooks();

   if (parseBooleanEnv(process.env['TRUST_PROXY'], false)) {
      app.getHttpAdapter().getInstance().set('trust proxy', 1);
   }

   configureSecurityHeaders(app);
   configureCors(app);
   app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
   app.setGlobalPrefix('api');
   app.enableVersioning({ type: VersioningType.URI });
   app.getHttpAdapter().getInstance().set('etag', false);

   const loggingService = app.get(LoggingService);
   const monitoringService = app.get(MonitoringService);
   const dbMigrationService = app.get(DbMigrationService);
   const dbSeederService = app.get(DbSeederService);

   app.useGlobalFilters(new AllExceptionsFilter(loggingService, monitoringService));

   // HTTP logger middleware with correlation ID tracking and monitoring integration
   app.use((req: Request, res: Response, next: () => void) => {
      const start = Date.now();
      const request = req as Request & {
         correlationId?: string;
         user?: { id?: number | string };
      };
      const correlationId = resolveCorrelationId(request);
      request.correlationId = correlationId;
      res.setHeader(CORRELATION_ID_HEADER, correlationId);

      runWithRequestContext(
         {
            correlationId,
            method: req.method,
            path: req.path,
            userId: null
         },
         () => {
            res.on('finish', () => {
               const duration = Date.now() - start;
               const userId = resolveUserId(request);
               updateRequestContext({ userId });

               monitoringService.recordRequest({
                  method: req.method,
                  path: req.path,
                  correlationId,
                  statusCode: res.statusCode,
                  durationMs: duration,
               });

               loggingService
                  .getLogger()
                  .child({ label: 'API' })
                  .log(
                     'http',
                     `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration} ms`
                  );
            });

            next();
         }
      );
   });

   if (process.env['SHOW_SWAGGER'] === 'true') {
      const config = new DocumentBuilder()
         .setTitle(`${appName} API`)
         .setDescription(appDescription)
         .setVersion(process.env['npm_package_version'] || '1.0.0')
         .addBearerAuth()
         .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
         .build();

      const document = SwaggerModule.createDocument(app, config);
      document.security = [{ 'x-api-key': [] }];
      SwaggerModule.setup('docs', app, document);
   }

   try {
      if (process.env['RUN_MIGRATIONS_ON_BOOT'] !== 'false') {
         await dbMigrationService.runMigrations();
      }

      if (process.env['RUN_SEEDERS_ON_BOOT'] === 'true') {
         await dbSeederService.runSeeder();
      }

      await app.listen(port, () => {
         Logger.log(`Server listening on port: ${port}`, 'Bootstrap');
      });
   } catch (error) {
      Logger.error(`Failed to start application: ${(error as Error).message}`, '', 'Bootstrap');
      process.exit(1);
   }
}

void bootstrap();
