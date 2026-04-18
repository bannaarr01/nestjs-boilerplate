import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestStore {
   correlationId: string;
   method?: string;
   path?: string;
   userId?: number | null;
}

export const requestContext = new AsyncLocalStorage<RequestStore>();

export function getRequestId(): string | undefined {
   return requestContext.getStore()?.correlationId;
}

export function getRequestContext(): RequestStore | undefined {
   return requestContext.getStore();
}

export function runWithRequestContext<T>(
   context: RequestStore,
   handler: () => T
): T {
   return requestContext.run(context, handler);
}

export function updateRequestContext(patch: Partial<RequestStore>): void {
   const current = requestContext.getStore();
   if (!current) {
      return;
   }
   Object.assign(current, patch);
}
