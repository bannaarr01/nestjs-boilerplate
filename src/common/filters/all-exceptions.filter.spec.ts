import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { LoggingService } from '../../logging/logging.service';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { CustomError } from '../classes/custom-error';
import { ErrorCode } from '../enums/error-code.enum';

describe('AllExceptionsFilter', () => {
   let filter: AllExceptionsFilter;
   let mockJson: jest.Mock;
   let mockStatus: jest.Mock;
   let mockHost: ArgumentsHost;
   let mockError: jest.Mock;

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
      filter = new AllExceptionsFilter(mockLogger);
   });

   it('should handle CustomError', () => {
      const exception = new CustomError('Not found', HttpStatus.NOT_FOUND, ErrorCode.RESOURCE_NOT_FOUND);

      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith({
         statusCode: HttpStatus.NOT_FOUND,
         message: 'Not found',
         errorCode: ErrorCode.RESOURCE_NOT_FOUND
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
         errorCode: ErrorCode.DUPLICATE_RECORD
      });
   });

   it('should handle HttpException with string response', () => {
      const exception = new HttpException('Forbidden resource', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockJson).toHaveBeenCalledWith({
         statusCode: HttpStatus.FORBIDDEN,
         message: 'Forbidden resource',
         errorCode: ErrorCode.FORBIDDEN
      });
   });

   it('should handle HttpException with array message by joining with ", "', () => {
      const exception = new HttpException(
         { message: ['field1 is required', 'field2 must be a string'] },
         HttpStatus.BAD_REQUEST
      );

      filter.catch(exception, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith({
         statusCode: HttpStatus.BAD_REQUEST,
         message: 'field1 is required, field2 must be a string',
         errorCode: ErrorCode.INVALID_INPUT
      });
   });

   it('should handle generic Error, log it, and return 500', () => {
      const exception = new Error('something broke');

      filter.catch(exception, mockHost);

      expect(mockError).toHaveBeenCalledWith('something broke', {
         label: 'AllExceptionsFilter',
         stack: exception.stack
      });
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith({
         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
         message: 'Internal Server Error',
         errorCode: ErrorCode.INTERNAL_SERVER_ERROR
      });
   });

   it('should handle non-error value, log it, and return 500', () => {
      const exception = 'some random string';

      filter.catch(exception, mockHost);

      expect(mockError).toHaveBeenCalledWith('Unknown error type', {
         label: 'AllExceptionsFilter',
         error: 'some random string'
      });
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith({
         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
         message: 'An unexpected error occurred',
         errorCode: ErrorCode.INTERNAL_SERVER_ERROR
      });
   });
});
