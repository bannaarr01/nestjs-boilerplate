import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../common/enums/error-code.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

type ApiResponseOptions = Partial<{
  statusCode: number;
  message: string;
  errorCode: ErrorCode;
}> &
  Record<string, unknown>;

export class ApiResponse<T> {
  @ApiProperty({ example: 200 })
     statusCode: number;

  @ApiProperty({ example: 'OK' })
     message: string;

  @ApiProperty({ description: 'Response payload' })
     data: T;

  @ApiPropertyOptional({ enum: ErrorCode, description: 'Application error code for non-success responses' })
     errorCode?: ErrorCode;

  [key: string]: unknown;

  constructor(data: T, options?: ApiResponseOptions) {
     this.statusCode = options?.statusCode ?? HttpStatus.OK;
     this.message = options?.message ?? 'OK';
     this.data = data;
     this.errorCode = options?.errorCode;

     if (options) {
        Object.keys(options).forEach(key => {
           if (!(key in this)) {
              this[key] = options[key];
           }
        });
     }
  }
}

export class PaginationMeta {
  @ApiProperty({ description: 'Items per page', example: 10 })
     limit: number;

  @ApiProperty({ description: 'Current offset', example: 0 })
     offset: number;

  @ApiProperty({ description: 'Item count in the current page', example: 10 })
     count: number;

  @ApiProperty({ description: 'Total items across all pages', example: 143 })
     total: number;

  @ApiProperty({ description: 'Total pages based on total and limit', example: 15 })
     totalPages: number;

  constructor(count: number, total: number, limit: number, offset: number) {
     this.total = total;
     this.limit = limit;
     this.offset = offset;
     this.count = count;
     this.totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  }
}


