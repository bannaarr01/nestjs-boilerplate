# API Conventions and Swagger

## Standard Response
Responses are auto-wrapped by the global `ResponseInterceptor` into a standard envelope.
Controllers using `ApiResponse<T>` are detected as already-wrapped and passed through.

Example success envelope:
```json
{
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

Example error envelope:
```json
{
  "statusCode": 400,
  "errorCode": "VALIDATION_FAILED",
  "message": "name must not be empty",
  "details": {
    "fields": [{ "path": "name", "issue": "must not be empty" }]
  },
  "correlationId": "abc-123"
}
```

### Response Decorators
- `@UnwrapResponse()` — skip envelope wrapping (for file downloads, SSE, raw responses)
- `@WrapResponse('Created')` — opt-in with custom message

## Swagger Decorator Standard
Use `ApiOperationAndResponses` from `src/common/decorators/api-ops.decorator.ts` for all endpoints.

It provides:
- operation summary/description
- success schema with `ApiResponse<T>`
- common error responses
- optional pagination model support

## Auth Decorator Standard
- Use `@Public()` for public endpoints.
- Use `@Role(...)` for role-based checks.
- Use `@ResourcePermission(resource, action)` for permission checks.

## Versioning Standard
- Import `ApiVersion` enum from `src/common/enums/api-version.enum.ts`.
- Use `@Version(ApiVersion.ONE)` instead of hardcoded strings.

## Throttle Decorator Standard
Use one-line format:
```ts
@Throttle({ default: { limit: 5, ttl: 60000 } })
```
Meaning: 5 requests per 60 seconds for that endpoint.

## Controller Style
- Wrap method body in `try/catch`.
- Delegate errors to `ErrorHandlerService`.
- Keep controllers thin; business logic belongs to service layer.
