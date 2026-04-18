import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { MonitoringService } from '../../monitoring/monitoring.service';
import { LoggingService } from '../../logging/logging.service';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { CustomError } from '../classes/custom-error';
import { ErrorCode } from '../enums/error-code.enum';

jest.mock('../../logging/request-context', () => ({
   getRequestId: jest.fn(() => 'test-correlation-id'),
   getRequestContext: jest.fn(() => ({
      correlationId: 'test-correlation-id',
      method: 'GET',
      path: '/test'
   }))
}));

describe('AllExceptionsFilter', () => {
   let filter: AllExceptionsFilter;
   let mockJson: jest.Mock;
   let mockStatus: jest.Mock;
   let mockHost: ArgumentsHost;
   let mockError: jest.Mock;
   let mockMonitoring: Partial<MonitoringService>;

   beforeEach(() => {
      mockJson = jest.fn();
      mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      mockHost = {
         switchToHttp: () => ({
            getResponse: () => ({ status: mockStatus })
         })
      } as unknown as ArgumentsHost;

      mockError = jest.fn();
      const mockLogger = { getLogger: () => ({ error: mockError }) } as unknown as LoggingService;
      mockMonitoring = { recordRequestError: jest.fn() };
      filter = new AllExceptionsFilter(mockLogger, mockMonitoring as MonitoringService);
   });

   it('should handle CustomError', () => {
      const exception = new CustomError('Not found', HttpStatus.NOT_FOUND, ErrorCode.RESOURCE_NOT_FOUND);

      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith({
         statusCode: HttpStatus.NOT_FOUND,
         message: 'Not found',
         errorCode: ErrorCode.RESOURCE_NOT_FOUND,
         correlationId: 'test-correlation-id'
      });
   });

   it('should handle CustomError with details', () => {
      const details = { fields: [{ path: 'email', issue: 'must be a valid email' }] };
      const exception = new CustomError(
         'Validation error',
         HttpStatus.BAD_REQUEST,
         ErrorCode.VALIDATION_FAILED,
         details
      );

      filter.catch(exception, mockHost);

      expect(mockJson).toHaveBeenCalledWith({
         statusCode: HttpStatus.BAD_REQUEST,
         message: 'Validation error',
         errorCode: ErrorCode.VALIDATION_FAILED,
         details,
         correlationId: 'test-correlation-id'
      });
   });

   it('should handle HttpException with object response containing message and errorCode', () => {
      const exception = new HttpException(
         { message: 'Duplicate entry', errorCode: ErrorCode.DUPLICATE_RECORD },
         HttpStatus.CONFLICT
      );

      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockJson).toHaveBeenCalledWith({
         statusCode: HttpStatus.CONFLICT,
         message: 'Duplicate entry',
         errorCode: ErrorCode.DUPLICATE_RECORD,
         correlationId: 'test-correlation-id'
      });
   });

   it('should handle HttpException with string response', () => {
      const exception = new HttpException('Forbidden resource', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockJson).toHaveBeenCalledWith({
         statusCode: HttpStatus.FORBIDDEN,
         message: 'Forbidden resource',
         errorCode: ErrorCode.FORBIDDEN,
         correlationId: 'test-correlation-id'
      });
   });

   it('should handle 400 with array message as VALIDATION_FAILED with field details', () => {
      const exception = new HttpException(
         { message: ['field1 is required', 'field2 must be a string'] },
         HttpStatus.BAD_REQUEST
      );

      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith({
         statusCode: HttpStatus.BAD_REQUEST,
         message: 'field1 is required, field2 must be a string',
         errorCode: ErrorCode.VALIDATION_FAILED,
         details: {
            fields: [
               { path: 'field1', issue: 'is required' },
               { path: 'field2', issue: 'must be a string' }
            ]
         },
         correlationId: 'test-correlation-id'
      });
   });

   it('should handle non-400 HttpException with array message by joining', () => {
      const exception = new HttpException(
         { message: ['error one', 'error two'] },
         HttpStatus.UNPROCESSABLE_ENTITY
      );

      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
         message: 'error one, error two',
         correlationId: 'test-correlation-id'
      }));
   });

   it('should handle generic Error, log it, and return 500', () => {
      const exception = new Error('something broke');

      filter.catch(exception, mockHost);

      expect(mockError).toHaveBeenCalledWith('something broke', {
         label: 'AllExceptionsFilter',
         stack: exception.stack,
         errorType: 'Error'
      });
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith({
         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
         message: 'Internal Server Error',
         errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
         correlationId: 'test-correlation-id'
      });
   });

   it('should handle non-error value, log it, and return 500', () => {
      const exception = 'some random string';

      filter.catch(exception, mockHost);

      expect(mockError).toHaveBeenCalledWith('some random string', {
         label: 'AllExceptionsFilter',
         stack: undefined,
         errorType: 'string'
      });
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith({
         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
         message: 'Internal Server Error',
         errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
         correlationId: 'test-correlation-id'
      });
   });

   it('should include correlationId in all error responses', () => {
      const exception = new HttpException('test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
         correlationId: 'test-correlation-id'
      }));
   });

   it('should call monitoringService.recordRequestError when monitoring is provided', () => {
      const exception = new Error('test error');

      filter.catch(exception, mockHost);

      expect(mockMonitoring.recordRequestError).toHaveBeenCalledWith({
         correlationId: 'test-correlation-id',
         method: 'GET',
         path: '/test',
         userId: undefined,
         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
         message: 'Internal Server Error'
      });
   });

   it('should handle HttpException with details in response', () => {
      const details = { fields: [{ path: 'name', issue: 'too short' }] };
      const exception = new HttpException(
         { message: 'Validation error', details },
         HttpStatus.UNPROCESSABLE_ENTITY
      );

      filter.catch(exception, mockHost);

      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
         details,
         correlationId: 'test-correlation-id'
      }));
   });
});
