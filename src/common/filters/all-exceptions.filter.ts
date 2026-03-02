import { Response } from 'express';
import { ErrorCode } from '../enums/error-code.enum';
import { CustomError } from '../classes/custom-error';
import { ErrorCodeUtil } from '../../utils/error-code.util';
import { LoggingService } from '../../logging/logging.service';
import { ErrorResponseBody, HttpExceptionResponseLike } from '../types/exception-filter.types';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
   constructor(private readonly logger: LoggingService) {}

   catch(exception: unknown, host: ArgumentsHost): void {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();

      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Internal Server Error';
      let errorCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR;

      if (exception instanceof CustomError) {
         statusCode = exception.statusCode;
         message = exception.customErrMsg;
         errorCode = exception.errorCode;
      } else if (exception instanceof HttpException) {
         statusCode = exception.getStatus();
         const exceptionResponse = exception.getResponse();

         if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
            const responseObj = exceptionResponse as HttpExceptionResponseLike;
            const responseMessage = Array.isArray(responseObj.message)
               ? responseObj.message.join(', ')
               : responseObj.message;

            errorCode = responseObj.errorCode || ErrorCodeUtil.getErrorCodeForStatus(statusCode);
            message = responseMessage || 'An error occurred';
         } else {
            errorCode = ErrorCodeUtil.getErrorCodeForStatus(statusCode);
            message = typeof exceptionResponse === 'string' ? exceptionResponse : 'An error occurred';
         }
      } else if (exception instanceof Error) {
         this.logger.getLogger().error(exception.message, {
            label: 'AllExceptionsFilter',
            stack: exception.stack
         });

         message = 'Internal Server Error';
      } else {
         this.logger.getLogger().error('Unknown error type', {
            label: 'AllExceptionsFilter',
            error: exception
         });
         message = 'An unexpected error occurred';
      }

      const errorResponse: ErrorResponseBody = {
         statusCode,
         message,
         errorCode
      };

      response.status(statusCode).json(errorResponse);
   }
}

