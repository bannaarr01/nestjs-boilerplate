# Auth Module

## Auth Provider

Controlled by `AUTH_PROVIDER` env var (default `none`).

| | `AUTH_PROVIDER=none` (default) | `AUTH_PROVIDER=keycloak` |
|---|---|---|
| Global guards | ApiKeyGuard (+ThrottleGuard) | ApiKeyGuard + AuthGuard + ResourceGuard + RoleGuard (+ThrottleGuard) |
| `@Public()` | Skips ApiKeyGuard | Skips ApiKeyGuard + Keycloak guards |
| `@Roles()` | No-op | Enforced by RoleGuard |
| `@AuthenticatedUser()` | `undefined` | JWT payload from Keycloak |
| `KEYCLOAK_*` env vars | Not required | Required |
| `GET /auth/me` | No user context | Returns Keycloak user info |

## Files
- `src/auth/auth.module.ts`
- `src/auth/auth.controller.ts`
- `src/auth/auth.service.ts`
- `src/config/auth/auth-config.module.ts` (guard registration)

## Endpoints
- `POST /api/v1/auth/login` (public)
- `GET /api/v1/auth/me` (requires auth + API key)

## Keycloak Setup
1. Set `AUTH_PROVIDER=keycloak` in `.env` (or use `--auth=keycloak` CLI flag).
2. Provide required env vars: `KEYCLOAK_BASE_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`.
3. Optionally provide: `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_PUBLIC_KEY`.
4. Start Keycloak via Docker: `docker compose --profile keycloak up -d`.

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
