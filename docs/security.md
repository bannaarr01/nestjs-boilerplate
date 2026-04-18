# Security Guide

## Secure Defaults in This Boilerplate
- Global API key guard enabled (always active).
- Keycloak auth guards enabled when `AUTH_PROVIDER=keycloak` (opt-in).
- Global throttle guard enabled.
- Strict CORS/security headers in bootstrap.
- Attachment local URLs are signed with HMAC.
- Proxy module blocks private/local targets by default.
- Unknown service errors are normalized to generic `Internal Server Error`.

## Production Checklist
1. Set strong secrets:
   - `API_KEY`
   - `JWT_SECRET`
   - `ATTACHMENT_URL_SIGNING_SECRET`
2. Set `NODE_ENV=production`.
3. Set `SHOW_SWAGGER=false` (or restrict docs access).
4. Keep `AUTH_DEMO_MODE=false`.
5. Keep proxy restrictions:
   - `PROXY_ALLOW_BASE_URL_OVERRIDE=false`
   - `PROXY_ALLOW_DYNAMIC_CONFIG=false`
   - `PROXY_ALLOW_PRIVATE_IPS=false`
6. Enable Redis-backed throttling for multi-instance deployments:
   - `REDIS_ENABLED=true`
   - `THROTTLE_USE_REDIS=true`
7. Set `TRUST_PROXY=true` only behind a trusted load balancer/proxy.

## Public Endpoints
Only mark endpoint `@Public()` when required.
Public routes bypass API key guard (and Keycloak guards when `AUTH_PROVIDER=keycloak`).

## File Upload Security
- MIME allow-list check
- file signature/content sniffing for common types
- signed URL protection for local file retrieval
- size limit via `ATTACHMENT_MAX_FILE_SIZE_BYTES`

## Guardrails to Keep
- Keep `ApiKeyGuard` registered globally.
- Keep `ErrorHandlerService` flow for predictable responses.
- Keep strict env validation on startup.
