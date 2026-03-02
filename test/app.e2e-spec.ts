import request from 'supertest';
import { AppModule } from '../src/app.module';
import { VersioningType } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('AppController (e2e)', () => {
   let app: INestApplication;

   beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
         imports: [AppModule]
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

   it('/api/v1/healthz (GET)', () => {
      return request(app.getHttpServer())
         .get('/api/v1/healthz')
         .expect(200)
         .expect(({ body }) => {
            expect(body.statusCode).toBe(200);
            expect(body.message).toBe('OK');
            expect(body.data.status).toBe('ok');
         });
   });
});


