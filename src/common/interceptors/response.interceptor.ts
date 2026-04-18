import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { WRAP_RESPONSE_KEY, WRAP_RESPONSE_MESSAGE_KEY } from '../decorators/wrap-response.decorator';
import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T> {
   constructor(private readonly reflector: Reflector) {}

   intercept(
      context: ExecutionContext,
      next: CallHandler<T>,
   ): Observable<unknown> {
      const explicitWrap = this.reflector.getAllAndOverride<boolean | undefined>(
         WRAP_RESPONSE_KEY,
         [context.getHandler(), context.getClass()],
      );

      if (explicitWrap === false) {
         return next.handle();
      }

      const customMessage = this.reflector.getAllAndOverride<string | undefined>(
         WRAP_RESPONSE_MESSAGE_KEY,
         [context.getHandler(), context.getClass()],
      );

      const statusCode = context.switchToHttp().getResponse<{ statusCode?: number }>().statusCode
         ?? HttpStatus.OK;
      const message = customMessage ?? 'OK';

      return next.handle().pipe(
         map((data) => {
            if (
               data !== null &&
               data !== undefined &&
               typeof data === 'object' &&
               'statusCode' in data &&
               'data' in data
            ) {
               return data;
            }

            if (
               data !== null &&
               data !== undefined &&
               typeof data === 'object' &&
               'pagination' in data
            ) {
               const { pagination, ...rest } = data as Record<string, unknown>;
               const items = rest['data'] ?? rest['items'] ?? rest;
               return { statusCode, message, data: items, pagination };
            }

            return { statusCode, message, data };
         }),
      );
   }
}
