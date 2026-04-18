# Operations and Deployment

## Docker Compose Profiles
Available profiles in `docker-compose.yml`:
- `postgres`
- `mysql`
- `redis`

Examples:
```bash
docker compose --profile postgres up -d
docker compose --profile mysql up -d
docker compose --profile redis up -d
```

## Boot Flow
1. Validate environment
2. Build app and initialize modules
3. Optionally run DB migrations
4. Optionally run seeders
5. Start HTTP server

## Health and Monitoring Endpoints
- Liveness: `GET /api/v1/healthz`
- Readiness: `GET /api/v1/readyz`
- Metrics: `GET /api/v1/monitoring/metrics` (requires `x-api-key` header)

Readiness checks:
- database
- Redis (or marked disabled when not enabled)

## Migration on Startup
- `RUN_MIGRATIONS_ON_BOOT=true` recommended
- `DB_VERIFY_MIGRATION_DIFF=true` only when you explicitly want diff checks

## Recommended Production Flags
- `NODE_ENV=production`
- `SHOW_SWAGGER=false` or protected
- strict secrets configured
- `AUTH_DEMO_MODE=false`
- throttle enabled
- Redis throttle for multi-instance

## Monitoring
The in-memory monitoring module tracks:
- Total request and error counts
- Slow endpoint detection (configurable via `SLOW_API_THRESHOLD_MS`, default 3000ms)
- Cache hit/miss ratios per key family

Access metrics via `GET /api/v1/monitoring/metrics` with a valid API key.

## Correlation ID
Every request receives a correlation ID (`x-correlation-id` response header):
- Sourced from `x-correlation-id` or `x-request-id` request header, or auto-generated UUID
- Included in all log lines and error responses for end-to-end tracing

## Graceful Shutdown
`app.enableShutdownHooks()` is enabled — the app handles `SIGTERM`/`SIGINT` gracefully.

## Cache
In-memory cache module (`AppCacheModule`) provides:
- `get`, `set`, `del` operations
- `getOrSet` cache-aside pattern with automatic cache hit/miss monitoring
- Configurable via `CACHE_TTL_DEFAULT` (seconds, default 300) and `CACHE_MAX_ITEMS` (default 1000)

## Log Notes
- Request logging via correlation ID middleware with Winston
- Application logging via Winston abstraction with per-request correlation ID prefix
