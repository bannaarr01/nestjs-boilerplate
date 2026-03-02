import { AppService } from './app.service';
import { AppController } from './app.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { ErrorHandlerService } from './common/services/error-handler.service';

describe('AppController', () => {
   let appController: AppController;

   beforeEach(async () => {
      const app: TestingModule = await Test.createTestingModule({
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
            }
         ]
      }).compile();

      appController = app.get<AppController>(AppController);
   });

   describe('getInfo', () => {
      it('should return project metadata', () => {
         const response = appController.getInfo();
         expect(response.statusCode).toBe(200);
         expect(response.message).toBe('OK');
         expect(response.data.name).toBe('nestjs-boilerplate');
         expect(response.data.dbClient).toBeDefined();
         expect(typeof response.data.redisEnabled).toBe('boolean');
      });
   });
});

