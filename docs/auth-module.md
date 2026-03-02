# Auth Module

## Files
- `src/auth/auth.module.ts`
- `src/auth/auth.controller.ts`
- `src/auth/auth.service.ts`
- `src/auth/strategies/jwt.strategy.ts`

## Endpoints
- `POST /api/v1/auth/login` (public)
- `GET /api/v1/auth/me` (requires JWT + API key)

## Demo Login Behavior
- Disabled by default (`AUTH_DEMO_MODE=false`).
- When enabled, credentials are validated against:
  - `AUTH_DEMO_EMAIL`
  - `AUTH_DEMO_PASSWORD`
- Roles/permissions come from env only:
  - `AUTH_DEMO_ROLES`
  - `AUTH_DEMO_PERMISSIONS`

## JWT Payload
- `sub`
- `email`
- `roles`
- `permissions`

## Best Practice
- Keep demo login only for local development.
- Replace `AuthService.login` with real user lookup before production usage.
- Do not accept roles/permissions from request body.
