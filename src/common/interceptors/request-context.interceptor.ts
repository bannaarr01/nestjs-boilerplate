import { Observable } from 'rxjs';
import type { Request } from 'express';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { resolveCorrelationId, CORRELATION_ID_HEADER } from '../../logging/correlation-id.middleware';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
   intercept(
      context: ExecutionContext,
      next: CallHandler
   ): Observable<unknown> {
      const http = context.switchToHttp();
      const request = http.getRequest<Request & { correlationId?: string; user?: { id?: number | string } }>();
      const response = http.getResponse<{
         setHeader: (name: string, value: string) => void;
      }>();

      const correlationId = resolveCorrelationId(request);
      request.correlationId = correlationId;
      response.setHeader(CORRELATION_ID_HEADER, correlationId);

      return next.handle();
   }
}
