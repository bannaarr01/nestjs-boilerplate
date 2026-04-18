# Architecture Overview

## Core Structure
- `src/main.ts`: bootstrap, CORS/security headers, global pipes/filters, correlation ID middleware, monitoring integration
- `src/app.module.ts`: module composition
- `src/common`: cross-cutting guards/decorators/interceptors/error handling
- `src/config`: auth, db, queue, redis, throttle, storage config
- `src/logging`: Winston logging with per-request correlation ID via AsyncLocalStorage
- `src/cache`: in-memory cache module with `getOrSet` cache-aside pattern
- `src/monitoring`: in-memory metrics (request/error counts, slow endpoints, cache stats)
- `src/auth`: JWT module and auth endpoints
- `src/database`: migrations and seeding services
- `src/queue`: BullMQ endpoints and service
- `src/storage`: local/S3 abstraction
- `src/attachment`: upload/list/get/delete attachment flows
- `src/mail`: provider abstraction and template rendering
- `src/proxy`: outbound HTTP client with policy checks

## Global Guard Order
Registered in `AuthConfigModule`:
1. `ApiKeyGuard`
2. `ThrottleGuard`
3. `JwtAuthGuard`
4. `RolesGuard`
5. `ResourcePermissionGuard`

## Global Interceptors
Registered in `AppModule` as `APP_INTERCEPTOR` (order matters):
1. `RequestContextInterceptor` — resolves correlation ID, sets `x-correlation-id` response header
2. `ResponseInterceptor` — auto-wraps responses in `{ statusCode, message, data }` envelope

Use `@UnwrapResponse()` to opt-out of wrapping (file downloads, SSE, raw responses).
Use `@WrapResponse('Custom message')` to override the default "OK" message.

## Request Context and Correlation ID
- `src/logging/request-context.ts` provides `AsyncLocalStorage`-based per-request store
- Every request gets a correlation ID (from `x-correlation-id` header, `x-request-id` header, or auto-generated UUID)
- Correlation ID appears in all log lines, error responses, and response headers

## Error Handling Pattern
- Controllers use `try/catch` and call `errorHandler.handleControllerError(...)`.
- Services use `try/catch` and `throw errorHandler.handleServiceError(...)`.
- Global filter normalizes uncaught exceptions to a stable response shape.
- Validation errors (400 + array message) produce `VALIDATION_FAILED` error code with `details.fields` array.
- All error responses include `correlationId` for tracing.
- `CustomError` supports an optional 4th `details` parameter for structured error metadata.

## Response Shape
- `ResponseInterceptor` auto-wraps responses in envelope (pass-through for already-wrapped `ApiResponse`):
  - `statusCode`
  - `message`
  - `data`
- Error responses include:
  - `statusCode`
  - `errorCode`
  - `message`
  - optional `details` (with `fields[]` for validation errors)
  - `correlationId`

## Versioning
- URI versioning is enabled globally.
- Use `ApiVersion` enum and `@Version(ApiVersion.ONE)` on versioned endpoints.
