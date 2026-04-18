import { Response } from 'express';
import { ErrorCode } from '../enums/error-code.enum';
import { CustomError } from '../classes/custom-error';
import { ErrorCodeUtil } from '../../utils/error-code.util';
import { LoggingService } from '../../logging/logging.service';
import { MonitoringService } from '../../monitoring/monitoring.service';
import { getRequestId, getRequestContext } from '../../logging/request-context';
import { ErrorResponseBody, FieldError, HttpExceptionResponseLike } from '../types/exception-filter.types';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable, Optional } from '@nestjs/common';

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
   constructor(
      private readonly logger: LoggingService,
      @Optional() private readonly monitoringService?: MonitoringService
   ) {}

   catch(exception: unknown, host: ArgumentsHost): void {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();

      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Internal Server Error';
      let errorCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR;
      let details: ErrorResponseBody['details'] | undefined;

      if (exception instanceof CustomError) {
         statusCode = exception.statusCode;
         message = exception.customErrMsg;
         errorCode = exception.errorCode;
         details = exception.details;
      } else if (exception instanceof HttpException) {
         statusCode = exception.getStatus();
         const exceptionResponse = exception.getResponse();

         if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
            const responseObj = exceptionResponse as HttpExceptionResponseLike;

            if (
               statusCode === HttpStatus.BAD_REQUEST &&
               Array.isArray(responseObj.message)
            ) {
               errorCode = ErrorCode.VALIDATION_FAILED;
               message = responseObj.message.join(', ');
               const fields: FieldError[] = responseObj.message.map((msg) =>
                  this.parseValidationMessage(msg),
               );
               details = { fields };
            } else {
               const responseMessage = Array.isArray(responseObj.message)
                  ? responseObj.message.join(', ')
                  : responseObj.message;

               errorCode = responseObj.errorCode || ErrorCodeUtil.getErrorCodeForStatus(statusCode);
               message = responseMessage || 'An error occurred';

               if (responseObj.details) {
                  details = responseObj.details;
               }
            }
         } else {
            errorCode = ErrorCodeUtil.getErrorCodeForStatus(statusCode);
            message = typeof exceptionResponse === 'string' ? exceptionResponse : 'An error occurred';
         }
      } else {
         const isError = exception instanceof Error;
         const errorMessage = isError ? exception.message : String(exception);
         const stack = isError ? exception.stack : undefined;

         this.logger.getLogger().error(errorMessage, {
            label: 'AllExceptionsFilter',
            stack,
            errorType: isError ? exception.constructor.name : typeof exception
         });

         message = 'Internal Server Error';
      }

      const correlationId = getRequestId() ?? '';
      const requestCtx = getRequestContext();

      this.monitoringService?.recordRequestError({
         correlationId,
         method: requestCtx?.method,
         path: requestCtx?.path,
         userId: requestCtx?.userId,
         statusCode,
         message
      });

      const errorResponse: ErrorResponseBody = {
         statusCode,
         errorCode,
         message,
         ...(details ? { details } : {}),
         correlationId
      };

      response.status(statusCode).json(errorResponse);
   }

   private parseValidationMessage(msg: string): FieldError {
      const spaceIndex = msg.indexOf(' ');
      if (spaceIndex > 0) {
         return {
            path: msg.slice(0, spaceIndex),
            issue: msg.slice(spaceIndex + 1),
         };
      }
      return { path: '', issue: msg };
   }
}
