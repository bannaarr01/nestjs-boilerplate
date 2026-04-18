import type { Request } from 'express';
import { randomUUID } from 'node:crypto';

type RequestWithContext = Request & {
   correlationId?: string;
   user?: { id?: number | string };
};

const CORRELATION_ID_HEADER = 'x-correlation-id';
const REQUEST_ID_HEADER = 'x-request-id';

export function resolveCorrelationId(request: RequestWithContext): string {
   const fromContext = request.correlationId?.trim();
   if (fromContext) {
      return fromContext;
   }

   const headers = request?.headers ?? {};
   const headerCorrelationId = String(headers[CORRELATION_ID_HEADER] ?? '').trim();
   if (headerCorrelationId) {
      return headerCorrelationId;
   }

   const headerRequestId = String(headers[REQUEST_ID_HEADER] ?? '').trim();
   if (headerRequestId) {
      return headerRequestId;
   }

   return randomUUID();
}

export function resolveUserId(request: RequestWithContext): number | null {
   const raw = request.user?.id;
   if (raw === undefined || raw === null || raw === '') {
      return null;
   }
   const normalized = Number(raw);
   return Number.isFinite(normalized) ? normalized : null;
}

export { CORRELATION_ID_HEADER };
