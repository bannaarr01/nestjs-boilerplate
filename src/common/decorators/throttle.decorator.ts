import { SetMetadata } from '@nestjs/common';

export const THROTTLE_METADATA_KEY = 'app:throttle-config';

export type ThrottleConfig = {
  limit: number;
  ttlMs: number;
};

export type ThrottleInput = {
  default: {
    limit: number;
    ttl: number;
  };
};

export const Throttle = (config: ThrottleInput): MethodDecorator & ClassDecorator =>
   SetMetadata(THROTTLE_METADATA_KEY, {
      limit: config.default.limit,
      ttlMs: config.default.ttl
   } satisfies ThrottleConfig);


