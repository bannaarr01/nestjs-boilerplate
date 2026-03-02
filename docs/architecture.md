# Architecture Overview

## Core Structure
- `src/main.ts`: bootstrap, CORS/security headers, global pipes/filters
- `src/app.module.ts`: module composition
- `src/common`: cross-cutting guards/decorators/error handling
- `src/config`: auth, db, queue, redis, throttle, storage config
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

## Error Handling Pattern
- Controllers use `try/catch` and call `errorHandler.handleControllerError(...)`.
- Services use `try/catch` and `throw errorHandler.handleServiceError(...)`.
- Global filter normalizes uncaught exceptions to a stable response shape.

## Response Shape
- Uses `ApiResponse<T>` envelope:
  - `statusCode`
  - `message`
  - `data`
  - optional `errorCode`

## Versioning
- URI versioning is enabled globally.
- Use `ApiVersion` enum and `@Version(ApiVersion.ONE)` on versioned endpoints.
