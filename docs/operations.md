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

## Health Endpoints
- Liveness: `GET /api/v1/healthz`
- Readiness: `GET /api/v1/readyz`

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

## Log Notes
- Request logging via `morgan`
- Application logging via Winston abstraction
