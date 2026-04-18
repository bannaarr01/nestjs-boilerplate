import request from 'supertest';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { AppService } from '../src/app.service';
import { INestApplication } from '@nestjs/common';
import { AppController } from '../src/app.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { ErrorHandlerService } from '../src/common/services/error-handler.service';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { RequestContextInterceptor } from '../src/common/interceptors/request-context.interceptor';

describe('AppController (e2e)', () => {
   let app: INestApplication;

   beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
         controllers: [AppController],
         providers: [
            {
               provide: AppService,
               useValue: {
                  getInfo: () => ({
                     name: 'nestjs-boilerplate',
                     version: '1.0.0',
                     dbClient: 'postgresql',
                     redisEnabled: false
                  }),
                  getReadiness: jest.fn()
               }
            },
            {
               provide: ErrorHandlerService,
               useValue: {
                  handleControllerError: jest.fn()
               }
            },
            {
               provide: APP_INTERCEPTOR,
               useClass: RequestContextInterceptor
            },
            {
               provide: APP_INTERCEPTOR,
               useClass: ResponseInterceptor
            }
         ]
      }).compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('api');
      app.enableVersioning({ type: VersioningType.URI });
      await app.init();
   });

   afterEach(async () => {
      if (app) {
         await app.close();
      }
   });

   it('/api/v1/healthz (GET) should return wrapped response with correlation ID header', () => {
      return request(app.getHttpServer())
         .get('/api/v1/healthz')
         .expect(200)
         .expect(({ body, headers }) => {
            expect(body.statusCode).toBe(200);
            expect(body.message).toBe('OK');
            expect(body.data.status).toBe('ok');
            expect(headers['x-correlation-id']).toBeDefined();
         });
   });
});
