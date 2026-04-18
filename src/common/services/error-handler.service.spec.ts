import { LoggingService } from '../../logging/logging.service';
import { ErrorHandlerService } from './error-handler.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CustomError } from '../classes/custom-error';
import { ErrorCode } from '../enums/error-code.enum';

class TestService {}

describe('ErrorHandlerService', () => {
   let service: ErrorHandlerService;
   let mockError: jest.Mock;

   beforeEach(async () => {
      mockError = jest.fn();

      const module: TestingModule = await Test.createTestingModule({
         providers: [
            ErrorHandlerService,
            {
               provide: LoggingService,
               useValue: {
                  getLogger: () => ({ error: mockError })
               }
            }
         ]
      }).compile();

      service = module.get<ErrorHandlerService>(ErrorHandlerService);
   });

   describe('handleControllerError', () => {
      it('re-throws HttpException with string response', () => {
         const error = new HttpException('Not found', HttpStatus.NOT_FOUND);

         expect(() => service.handleControllerError(error, TestService, '.method')).toThrow(HttpException);

         try {
            service.handleControllerError(error, TestService, '.method');
         } catch (e) {
            const thrown = e as HttpException;
            expect(thrown.getStatus()).toBe(HttpStatus.NOT_FOUND);
            const body = thrown.getResponse() as Record<string, unknown>;
            expect(body.statusCode).toBe(HttpStatus.NOT_FOUND);
            expect(body.message).toBe('Not found');
            expect(body.errorCode).toBe(ErrorCode.RESOURCE_NOT_FOUND);
         }
      });

      it('re-throws HttpException with object response containing message array', () => {
         const error = new HttpException(
            { message: ['field is required', 'field is invalid'] },
            HttpStatus.BAD_REQUEST
         );

         try {
            service.handleControllerError(error, TestService, '.validate');
         } catch (e) {
            const thrown = e as HttpException;
            expect(thrown.getStatus()).toBe(HttpStatus.BAD_REQUEST);
            const body = thrown.getResponse() as Record<string, unknown>;
            expect(body.message).toBe('field is required, field is invalid');
            expect(body.errorCode).toBe(ErrorCode.INVALID_INPUT);
         }
      });

      it('re-throws HttpException preserving errorCode from response', () => {
         const error = new HttpException(
            { message: 'duplicate', errorCode: ErrorCode.DUPLICATE_RECORD },
            HttpStatus.CONFLICT
         );

         try {
            service.handleControllerError(error, TestService, '.create');
         } catch (e) {
            const body = (e as HttpException).getResponse() as Record<string, unknown>;
            expect(body.errorCode).toBe(ErrorCode.DUPLICATE_RECORD);
         }
      });

      it('wraps a generic Error as HttpException with 500', () => {
         const error = new Error('something broke');

         try {
            service.handleControllerError(error, TestService, '.run');
         } catch (e) {
            const thrown = e as HttpException;
            expect(thrown).toBeInstanceOf(HttpException);
            expect(thrown.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
            const body = thrown.getResponse() as Record<string, unknown>;
            expect(body.message).toBe('something broke');
            expect(body.errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
         }
      });

      it('wraps an error-like object using its statusCode and customErrMsg', () => {
         const error = { customErrMsg: 'bad input', statusCode: 400 };

         try {
            service.handleControllerError(error, TestService, '.parse');
         } catch (e) {
            const thrown = e as HttpException;
            expect(thrown.getStatus()).toBe(HttpStatus.BAD_REQUEST);
            const body = thrown.getResponse() as Record<string, unknown>;
            expect(body.message).toBe('bad input');
            expect(body.errorCode).toBe(ErrorCode.INVALID_INPUT);
         }
      });

      it('uses status field when statusCode is absent', () => {
         const error = { message: 'forbidden', status: 403 };

         try {
            service.handleControllerError(error, TestService, '.access');
         } catch (e) {
            const thrown = e as HttpException;
            expect(thrown.getStatus()).toBe(HttpStatus.FORBIDDEN);
         }
      });

      it('logs the error with the correct label', () => {
         const error = new Error('test');

         try {
            service.handleControllerError(error, TestService, '.doStuff');
         } catch {
            // expected
         }

         expect(mockError).toHaveBeenCalledWith('test', expect.objectContaining({
            label: 'TestService.doStuff'
         }));
      });
   });

   describe('handleServiceError', () => {
      it('re-throws CustomError as-is', () => {
         const error = new CustomError('already custom', HttpStatus.CONFLICT, ErrorCode.DUPLICATE_RECORD);

         try {
            service.handleServiceError(error, TestService, '.save');
         } catch (e) {
            expect(e).toBe(error);
         }
      });

      it('detects duplicate error from message containing "duplicate"', () => {
         const error = new Error('duplicate key value violates unique constraint');

         try {
            service.handleServiceError(error, TestService, '.create');
         } catch (e) {
            const thrown = e as CustomError;
            expect(thrown).toBeInstanceOf(CustomError);
            expect(thrown.statusCode).toBe(HttpStatus.CONFLICT);
            expect(thrown.errorCode).toBe(ErrorCode.DUPLICATE_RECORD);
            expect(thrown.customErrMsg).toBe('A record with the same details already exists');
         }
      });

      it('detects duplicate error from message containing "already exists"', () => {
         const error = new Error('User already exists');

         try {
            service.handleServiceError(error, TestService, '.register');
         } catch (e) {
            expect((e as CustomError).errorCode).toBe(ErrorCode.DUPLICATE_RECORD);
         }
      });

      it('detects duplicate error from message containing "unique"', () => {
         const error = new Error('unique constraint violation on email');

         try {
            service.handleServiceError(error, TestService, '.insert');
         } catch (e) {
            expect((e as CustomError).errorCode).toBe(ErrorCode.DUPLICATE_RECORD);
         }
      });

      it('detects not-found error from message containing "not found"', () => {
         const error = new Error('Entity not found');

         try {
            service.handleServiceError(error, TestService, '.findOne');
         } catch (e) {
            const thrown = e as CustomError;
            expect(thrown.statusCode).toBe(HttpStatus.NOT_FOUND);
            expect(thrown.errorCode).toBe(ErrorCode.RESOURCE_NOT_FOUND);
            expect(thrown.customErrMsg).toBe('Requested resource not found');
         }
      });

      it('detects not-found error from message containing "does not exist"', () => {
         const error = new Error('Record does not exist');

         try {
            service.handleServiceError(error, TestService, '.get');
         } catch (e) {
            expect((e as CustomError).statusCode).toBe(HttpStatus.NOT_FOUND);
         }
      });

      it('detects unauthorized error from message', () => {
         const error = new Error('unauthorized access attempt');

         try {
            service.handleServiceError(error, TestService, '.auth');
         } catch (e) {
            const thrown = e as CustomError;
            expect(thrown.statusCode).toBe(HttpStatus.UNAUTHORIZED);
            expect(thrown.errorCode).toBe(ErrorCode.UNAUTHORIZED);
         }
      });

      it('detects unauthorized error from status field', () => {
         const error = { message: 'nope', status: 401 };

         try {
            service.handleServiceError(error, TestService, '.auth');
         } catch (e) {
            expect((e as CustomError).statusCode).toBe(HttpStatus.UNAUTHORIZED);
         }
      });

      it('detects forbidden error from message', () => {
         const error = new Error('forbidden resource');

         try {
            service.handleServiceError(error, TestService, '.access');
         } catch (e) {
            const thrown = e as CustomError;
            expect(thrown.statusCode).toBe(HttpStatus.FORBIDDEN);
            expect(thrown.errorCode).toBe(ErrorCode.FORBIDDEN);
         }
      });

      it('detects forbidden error from message containing "insufficient permission"', () => {
         const error = new Error('insufficient permission for this action');

         try {
            service.handleServiceError(error, TestService, '.access');
         } catch (e) {
            expect((e as CustomError).statusCode).toBe(HttpStatus.FORBIDDEN);
         }
      });

      it('detects forbidden error from status field', () => {
         const error = { message: 'denied', status: 403 };

         try {
            service.handleServiceError(error, TestService, '.access');
         } catch (e) {
            expect((e as CustomError).statusCode).toBe(HttpStatus.FORBIDDEN);
         }
      });

      it('detects timeout error from message', () => {
         const error = new Error('connection timeout after 30s');

         try {
            service.handleServiceError(error, TestService, '.fetch');
         } catch (e) {
            const thrown = e as CustomError;
            expect(thrown.statusCode).toBe(HttpStatus.REQUEST_TIMEOUT);
            expect(thrown.errorCode).toBe(ErrorCode.REQUEST_TIMEOUT);
         }
      });

      it('detects timeout error from ETIMEDOUT code', () => {
         const error = { message: 'request failed', code: 'ETIMEDOUT' };

         try {
            service.handleServiceError(error, TestService, '.call');
         } catch (e) {
            expect((e as CustomError).statusCode).toBe(HttpStatus.REQUEST_TIMEOUT);
         }
      });

      it('detects service unavailable from "connection refused"', () => {
         const error = new Error('connection refused to downstream');

         try {
            service.handleServiceError(error, TestService, '.proxy');
         } catch (e) {
            const thrown = e as CustomError;
            expect(thrown.statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
            expect(thrown.errorCode).toBe(ErrorCode.SERVICE_UNAVAILABLE);
         }
      });

      it('detects service unavailable from ECONNREFUSED code', () => {
         const error = { message: 'failed', code: 'ECONNREFUSED' };

         try {
            service.handleServiceError(error, TestService, '.connect');
         } catch (e) {
            expect((e as CustomError).statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
         }
      });

      it('detects service unavailable from ENOTFOUND code', () => {
         const error = { message: 'failed', code: 'ENOTFOUND' };

         try {
            service.handleServiceError(error, TestService, '.resolve');
         } catch (e) {
            expect((e as CustomError).statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
         }
      });

      it('detects service unavailable from "service unavailable" message', () => {
         const error = new Error('service unavailable');

         try {
            service.handleServiceError(error, TestService, '.health');
         } catch (e) {
            expect((e as CustomError).statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
         }
      });

      it('falls back to internal server error for unrecognized errors', () => {
         const error = new Error('something totally unexpected');

         try {
            service.handleServiceError(error, TestService, '.unknown');
         } catch (e) {
            const thrown = e as CustomError;
            expect(thrown).toBeInstanceOf(CustomError);
            expect(thrown.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
            expect(thrown.errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
            expect(thrown.customErrMsg).toBe('Internal Server Error');
         }
      });

      it('logs the error with errorType included', () => {
         const error = new Error('test');

         try {
            service.handleServiceError(error, TestService, '.op');
         } catch {
            // expected
         }

         expect(mockError).toHaveBeenCalledWith('test', expect.objectContaining({
            label: 'TestService.op',
            errorType: 'Error'
         }));
      });
   });

   describe('throwCustomError', () => {
      it('throws CustomError with provided message and status', () => {
         try {
            service.throwCustomError('bad request', HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST);
         } catch (e) {
            const thrown = e as CustomError;
            expect(thrown).toBeInstanceOf(CustomError);
            expect(thrown.customErrMsg).toBe('bad request');
            expect(thrown.statusCode).toBe(HttpStatus.BAD_REQUEST);
            expect(thrown.errorCode).toBe(ErrorCode.BAD_REQUEST);
         }
      });

      it('defaults to 500 status when not specified', () => {
         try {
            service.throwCustomError('oops');
         } catch (e) {
            const thrown = e as CustomError;
            expect(thrown.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
            expect(thrown.errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
         }
      });

      it('derives errorCode from statusCode when errorCode is not specified', () => {
         try {
            service.throwCustomError('not found', HttpStatus.NOT_FOUND);
         } catch (e) {
            const thrown = e as CustomError;
            expect(thrown.statusCode).toBe(HttpStatus.NOT_FOUND);
            expect(thrown.errorCode).toBe(ErrorCode.RESOURCE_NOT_FOUND);
         }
      });
   });
});
