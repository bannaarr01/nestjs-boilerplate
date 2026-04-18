import { ErrorCode } from '../enums/error-code.enum';
import { ClassConstructor } from 'class-transformer';
import { CustomError } from '../classes/custom-error';
import { ErrorCodeUtil } from '../../utils/error-code.util';
import { LoggingService } from '../../logging/logging.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

type ErrorLike = {
  message?: string;
  customErrMsg?: string;
  statusCode?: number;
  status?: number;
  errorCode?: ErrorCode;
  stack?: string;
  name?: string;
  code?: string;
  constructor?: { name?: string };
  error?: { message?: string };
};

@Injectable()
export class ErrorHandlerService {
   constructor(private readonly logger: LoggingService) {}

   handleControllerError<T>(error: unknown, contextClass: ClassConstructor<T>, context: string): never {
      const errorLike = this.asErrorLike(error);
      const errorMessage = this.getErrorMessage(error);

      this.logger.getLogger().error(errorMessage, {
         label: `${contextClass.name}${context}`,
         stack: errorLike.stack
      });

      if (error instanceof HttpException) {
         const statusCode = error.getStatus();
         const response = error.getResponse();
         const message =
        typeof response === 'string'
           ? response
           : (response as { message?: string | string[] }).message || errorMessage;
         const normalizedMessage = Array.isArray(message) ? message.join(', ') : message;
         const errorCode =
        this.asErrorLike(response).errorCode || ErrorCodeUtil.getErrorCodeForStatus(statusCode);

         throw new HttpException(
            {
               statusCode,
               message: normalizedMessage,
               errorCode
            },
            statusCode
         );
      }

      const statusCode = errorLike.statusCode || errorLike.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = errorLike.customErrMsg || errorLike.message || 'Internal Server Error';
      const errorCode = errorLike.errorCode || ErrorCodeUtil.getErrorCodeForStatus(statusCode);

      throw new HttpException(
         {
            statusCode,
            message,
            errorCode
         },
         statusCode
      );
   }

   throwCustomError(
      customErrMsg: string,
      statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode?: ErrorCode
   ): never {
      const code = errorCode || ErrorCodeUtil.getErrorCodeForStatus(statusCode);
      throw new CustomError(customErrMsg, statusCode, code);
   }

   handleServiceError<T>(error: unknown, contextClass: ClassConstructor<T>, context: string): never {
      const errorLike = this.asErrorLike(error);
      const errorMessage = this.getErrorMessage(error);

      this.logger.getLogger().error(errorMessage, {
         label: `${contextClass.name}${context}`,
         stack: errorLike.stack,
         errorType: errorLike.constructor?.name || errorLike.name
      });

      if (error instanceof CustomError) {
         throw error;
      }

      if (this.isDuplicateError(errorMessage)) {
         throw new CustomError(
            'A record with the same details already exists',
            HttpStatus.CONFLICT,
            ErrorCode.DUPLICATE_RECORD
         );
      }

      if (this.isNotFoundError(errorMessage)) {
         throw new CustomError(
            'Requested resource not found',
            HttpStatus.NOT_FOUND,
            ErrorCode.RESOURCE_NOT_FOUND
         );
      }

      if (this.isUnauthorizedError(errorMessage, errorLike)) {
         throw new CustomError('Unauthorized request', HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
      }

      if (this.isForbiddenError(errorMessage, errorLike)) {
         throw new CustomError('Insufficient permissions', HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN);
      }

      if (this.isTimeoutError(errorMessage, errorLike)) {
         throw new CustomError('Operation timed out', HttpStatus.REQUEST_TIMEOUT, ErrorCode.REQUEST_TIMEOUT);
      }

      if (this.isServiceUnavailableError(errorMessage, errorLike)) {
         throw new CustomError(
            'Service temporarily unavailable',
            HttpStatus.SERVICE_UNAVAILABLE,
            ErrorCode.SERVICE_UNAVAILABLE
         );
      }

      throw new CustomError(
         'Internal Server Error',
         HttpStatus.INTERNAL_SERVER_ERROR,
         ErrorCode.INTERNAL_SERVER_ERROR
      );
   }

   private getErrorMessage(error: unknown): string {
      if (!error) {
         return 'Unknown error occurred';
      }

      if (typeof error === 'string') {
         return error;
      }

      const errorLike = this.asErrorLike(error);

      if (errorLike.customErrMsg) {
         return errorLike.customErrMsg;
      }

      if (errorLike.message) {
         return errorLike.message;
      }

      if (errorLike.error?.message) {
         return errorLike.error.message;
      }

      return 'An unexpected error occurred';
   }

   private isDuplicateError(errorMessage: string): boolean {
      const value = errorMessage.toLowerCase();
      return value.includes('duplicate') || value.includes('already exists') || value.includes('unique');
   }

   private isNotFoundError(errorMessage: string): boolean {
      const value = errorMessage.toLowerCase();
      return value.includes('not found') || value.includes('does not exist') || value.includes('entity not found');
   }

   private isUnauthorizedError(errorMessage: string, errorLike: ErrorLike): boolean {
      const value = errorMessage.toLowerCase();
      return value.includes('unauthorized') || errorLike.status === HttpStatus.UNAUTHORIZED;
   }

   private isForbiddenError(errorMessage: string, errorLike: ErrorLike): boolean {
      const value = errorMessage.toLowerCase();
      return (
         value.includes('forbidden') ||
      value.includes('insufficient permission') ||
      errorLike.status === HttpStatus.FORBIDDEN
      );
   }

   private isTimeoutError(errorMessage: string, errorLike: ErrorLike): boolean {
      const value = errorMessage.toLowerCase();
      return value.includes('timeout') || errorLike.code === 'ETIMEDOUT';
   }

   private isServiceUnavailableError(errorMessage: string, errorLike: ErrorLike): boolean {
      const value = errorMessage.toLowerCase();
      return (
         value.includes('connection refused') ||
      value.includes('cannot connect') ||
      value.includes('service unavailable') ||
      errorLike.code === 'ECONNREFUSED' ||
      errorLike.code === 'ENOTFOUND'
      );
   }

   private asErrorLike(error: unknown): ErrorLike {
      if (!error || typeof error !== 'object') {
         return {};
      }

      return error as ErrorLike;
   }
}

