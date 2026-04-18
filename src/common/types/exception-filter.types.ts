import { ErrorCode } from '../enums/error-code.enum';

export type FieldError = {
  path: string;
  issue: string;
};

export type ErrorDetails = {
  fields?: FieldError[];
  [key: string]: unknown;
};

export type ErrorResponseBody = {
  statusCode: number;
  errorCode: ErrorCode;
  message: string;
  details?: ErrorDetails;
  correlationId: string;
};

export type HttpExceptionResponseLike = {
  errorCode?: ErrorCode;
  message?: string | string[];
  details?: ErrorDetails;
};
