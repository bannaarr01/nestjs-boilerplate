import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../common/enums/error-code.enum';

export class ErrorCodeUtil {
   static getErrorCodeForStatus(statusCode: number): ErrorCode {
      const statusCodeMap: { [key: number]: ErrorCode } = {
         [HttpStatus.BAD_REQUEST]: ErrorCode.INVALID_INPUT,
         [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
         [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
         [HttpStatus.NOT_FOUND]: ErrorCode.RESOURCE_NOT_FOUND,
         [HttpStatus.CONFLICT]: ErrorCode.DUPLICATE_RECORD,
         [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.RATE_LIMIT_EXCEEDED,
         [HttpStatus.REQUEST_TIMEOUT]: ErrorCode.PAYMENT_TIMEOUT,
         [HttpStatus.INTERNAL_SERVER_ERROR]: ErrorCode.INTERNAL_SERVER_ERROR,
         [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.SERVICE_UNAVAILABLE,
         [HttpStatus.NOT_IMPLEMENTED]: ErrorCode.NOT_IMPLEMENTED
      };

      return statusCodeMap[statusCode] || ErrorCode.INTERNAL_SERVER_ERROR;
   }
}


