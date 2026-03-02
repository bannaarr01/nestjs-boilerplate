import { HttpStatus } from '@nestjs/common';
import { ErrorCodeUtil } from './error-code.util';
import { ErrorCode } from '../common/enums/error-code.enum';

describe('ErrorCodeUtil', () => {
   it('maps known HTTP status codes to error codes', () => {
      expect(ErrorCodeUtil.getErrorCodeForStatus(HttpStatus.BAD_REQUEST)).toBe(ErrorCode.INVALID_INPUT);
      expect(ErrorCodeUtil.getErrorCodeForStatus(HttpStatus.UNAUTHORIZED)).toBe(ErrorCode.UNAUTHORIZED);
      expect(ErrorCodeUtil.getErrorCodeForStatus(HttpStatus.NOT_FOUND)).toBe(ErrorCode.RESOURCE_NOT_FOUND);
      expect(ErrorCodeUtil.getErrorCodeForStatus(HttpStatus.CONFLICT)).toBe(ErrorCode.DUPLICATE_RECORD);
      expect(ErrorCodeUtil.getErrorCodeForStatus(HttpStatus.TOO_MANY_REQUESTS)).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
   });

   it('falls back to internal server error for unknown status', () => {
      expect(ErrorCodeUtil.getErrorCodeForStatus(999)).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
   });
});


