import { ApiResponse, PaginationMeta } from '../../utils/api.util';
import { HttpStatus, Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOperation, ApiResponse as SwaggerApiResponse, getSchemaPath } from '@nestjs/swagger';

type ApiOperationAndResponsesOptions = {
  summary?: string;
  description?: string;
  responseModel?: Type<unknown>;
  responseStatus?: number;
  isArray?: boolean;
  withPagination?: boolean;
  includeDefaultResponses?: boolean;
  responseDescriptions?: Record<number, string>;
};

export const ApiOperationAndResponses = ({
   summary = '',
   description = '',
   responseModel,
   responseStatus = HttpStatus.OK,
   isArray = false,
   withPagination = false,
   includeDefaultResponses = true,
   responseDescriptions: providedResponseDescriptions = {}
}: ApiOperationAndResponsesOptions = {}): MethodDecorator => {
   const defaultResponseDescriptions: Record<number, string> = {
      [HttpStatus.OK]: 'OK',
      [HttpStatus.BAD_REQUEST]: 'Bad request with error message.',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized request.',
      [HttpStatus.NOT_FOUND]: 'Not found.',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable entity.',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal server error.'
   };

   const baseResponseDescriptions = includeDefaultResponses ? defaultResponseDescriptions : {};
   const responseDescriptions = {
      ...baseResponseDescriptions,
      ...providedResponseDescriptions
   };

   const successDescription = responseDescriptions[responseStatus] || 'OK';

   const decorators: MethodDecorator[] = [ApiOperation({ summary, description })];

   if (responseModel) {
      const dataSchema = isArray
         ? {
            type: 'array',
            items: { $ref: getSchemaPath(responseModel) }
         }
         : {
            $ref: getSchemaPath(responseModel)
         };

      decorators.push(
         ApiExtraModels(ApiResponse, responseModel, ...(withPagination ? [PaginationMeta] : [])),
         SwaggerApiResponse({
            status: responseStatus,
            description: successDescription,
            schema: {
               allOf: [
                  { $ref: getSchemaPath(ApiResponse) },
                  {
                     properties: {
                        data: dataSchema,
                        ...(withPagination ? { pagination: { $ref: getSchemaPath(PaginationMeta) } } : {})
                     }
                  }
               ]
            }
         })
      );
   } else {
      decorators.push(
         SwaggerApiResponse({
            status: responseStatus,
            description: successDescription
         })
      );
   }

   decorators.push(
      ...Object.entries(responseDescriptions)
         .filter(([status]) => Number(status) !== responseStatus)
         .map(([status, responseDescription]) =>
            SwaggerApiResponse({
               status: +status,
               description: responseDescription
            })
         )
   );

   return function (target: object, key: string | symbol, descriptor: TypedPropertyDescriptor<unknown>) {
      return applyDecorators(...decorators)(target, key, descriptor);
   };
};


