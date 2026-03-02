import { isDevelopment, parseBooleanEnv } from '../../utils/env.util';

export type ThrottleSettings = {
  enabled: boolean;
  limit: number;
  ttlMs: number;
};

function toPositiveNumber(value: string | undefined, fallback: number): number {
   const parsed = Number(value);
   return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getDefaultThrottleSettings(): ThrottleSettings {
   const enabled = parseBooleanEnv(process.env.THROTTLE_ENABLED, true);

   if (!enabled) {
      return {
         enabled: false,
         limit: 0,
         ttlMs: 0
      };
   }

   if (isDevelopment()) {
      return {
         enabled: true,
         limit: toPositiveNumber(process.env.THROTTLE_DEV_LIMIT, 0),
         ttlMs: toPositiveNumber(process.env.THROTTLE_DEV_TTL_MS, 0)
      };
   }

   return {
      enabled: true,
      limit: toPositiveNumber(process.env.THROTTLE_DEFAULT_LIMIT, 100),
      ttlMs: toPositiveNumber(process.env.THROTTLE_DEFAULT_TTL_MS, 60000)
   };
}


