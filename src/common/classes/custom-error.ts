import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';

export class CustomError extends Error {
   statusCode: number;
   customErrMsg: string;
   errorCode: ErrorCode;

   constructor(
      customErrMsg: string,
      statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR
   ) {
      super(customErrMsg);
      this.name = 'CustomError';
      this.statusCode = statusCode;
      this.customErrMsg = customErrMsg;
      this.errorCode = errorCode;
   }
}


