# API Conventions and Swagger

## Standard Response
All endpoints should return `ApiResponse<T>` from `src/utils/api.util.ts`.

Example success envelope:
```json
{
  "statusCode": 200,
  "message": "OK",
  "data": {}
}
```

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
