import { SetMetadata } from '@nestjs/common';

export const WRAP_RESPONSE_KEY = 'wrapResponse';
export const WRAP_RESPONSE_MESSAGE_KEY = 'wrapResponseMessage';

/**
 * Opt-out of the response envelope.
 * Use this for file downloads, SSE streams, or raw responses.
 */
export const UnwrapResponse = (): ReturnType<typeof SetMetadata> => SetMetadata(WRAP_RESPONSE_KEY, false);

/**
 * Opt-in to the response envelope with an optional custom message.
 * @param message - Override the default "OK" message.
 */
export const WrapResponse = (message?: string) => {
   const decorators = [SetMetadata(WRAP_RESPONSE_KEY, true)];
   if (message) {
      decorators.push(SetMetadata(WRAP_RESPONSE_MESSAGE_KEY, message));
   }
   return (target: object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<unknown>) => {
      for (const decorator of decorators) {
         if (descriptor) {
            (decorator as MethodDecorator)(target, propertyKey!, descriptor);
         } else {
            (decorator as ClassDecorator)(target as CallableFunction);
         }
      }
   };
};
