import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';
import { ErrorDetails } from '../types/exception-filter.types';

export class CustomError extends Error {
   statusCode: number;
   customErrMsg: string;
   errorCode: ErrorCode;
   details?: ErrorDetails | undefined;

   constructor(
      customErrMsg: string,
      statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
      details?: ErrorDetails
   ) {
      super(customErrMsg);
      this.name = 'CustomError';
      this.statusCode = statusCode;
      this.customErrMsg = customErrMsg;
      this.errorCode = errorCode;
      this.details = details;
   }
}
