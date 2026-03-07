# NestJS Boilerplate

Reusable NestJS starter.

## Documentation
- Full docs index: [docs/README.md](./docs/README.md)
- Quick start: [docs/quick-start.md](./docs/quick-start.md)
- Runtime profile setup: [docs/runtime-profiles.md](./docs/runtime-profiles.md)
- Security guide: [docs/security.md](./docs/security.md)

## Included Foundations
- NestJS bootstrap with CORS, validation, URI versioning, Swagger toggle
- Keycloak auth via `nest-keycloak-connect` + global API key guard (`x-api-key`)
- `ApiOperationAndResponses` + role/public decorators aligned with learning-platform
- Centralized `ErrorHandlerService` and controller/service `try/catch` pattern
- MikroORM with migration + seeder services
- PostgreSQL/MySQL switching via command options
- Optional Redis/BullMQ
- Flexible infrastructure modules:
  - `ProxyModule` (env JSON service map)
  - `MailModule` (`console` | `sendgrid` | `smtp` | `ses`)
  - `StorageModule` (`local` | `s3`)
  - `QueueModule` (optional BullMQ endpoints backed by Redis)
  - `AttachmentModule` (upload/list/get/delete + signed URLs)
  - upload interceptor config in `src/config/storage/multer-storage.config.ts`
- Custom MikroORM migration generator (`CustomMigrationGenerator`) with:
  - optional table include filtering (`DB_MIGRATION_INCLUDED_TABLES`)
  - optional schema exclude filtering (`DB_MIGRATION_EXCLUDED_SCHEMAS`)
  - SQL formatting adapted to PostgreSQL/MySQL
- TsMorph metadata provider for entity TS type discovery

## 1. Setup

```bash
cp .env.example .env
npm install
```

Git usage note:
- New projects should be independent repositories.
- You do not need to keep an active Git link to this boilerplate repo.

## 1.1 One-Time Skill Activation (Claude + Codex)

Project skills are stored in `.claude/skills`. To make them available in Codex as well, run once:

macOS/Linux:

```bash
bash scripts/setup-codex-skills.sh
```

Windows (PowerShell):

```powershell
pwsh -File .\scripts\setup-codex-skills.ps1
```

Included skills:
- `add-module`
- `add-endpoint`
- `add-migration`
- `add-test`
- `review`
- `handoff`
- `sort-imports`
- `typescript-review`
- `security-audit`

## 2. Runtime Profile (Autowire)

Defaults:
- `DB_CLIENT=postgresql`
- `REDIS_ENABLED=false`
- `STORAGE_PROVIDER=local`
- `MAIL_PROVIDER=console`
- `KEYCLOAK_REALM=app`

Set once (writes `.env` and optionally starts Docker services):

```bash
npm run setup:profile -- --db=postgres --schema=public --redis=off --storage=local --mail=console --docker=on
npm run setup:profile -- --db=mysql --redis=on --storage=s3 --mail=smtp --docker=on
npm run setup:profile -- --db=postgres --schema=public --redis=off --storage=local --mail=ses --docker=off
```

After that, run normally:

```bash
npm run start:dev
```

If you want ad-hoc override, you can still switch per command:

```bash
npm run start:dev -- --db=postgres --schema=public --redis=off --storage=local --mail=console
npm run start:dev -- --db=mysql --redis=on --storage=s3 --mail=smtp
npm run start:dev -- --db=postgres --schema=public --redis=off --storage=local --mail=ses
```

Supported values:
- DB: `postgres`, `postgresql`, `pg`, `mysql`, `mariadb`
- Redis: `on`, `off`, `true`, `false`, `1`, `0`, `yes`, `no`
- Storage: `local`, `s3`
- Mail: `console`, `sendgrid`, `smtp`, `ses`

Use standard DB env keys for both clients:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
- `DB_SCHEMA` (required for PostgreSQL)
- Connection pool tuning (optional): `DB_POOL_MIN`, `DB_POOL_MAX`, `DB_POOL_ACQUIRE_TIMEOUT_MS`, `DB_POOL_CREATE_TIMEOUT_MS`, `DB_POOL_IDLE_TIMEOUT_MS`

DB connection notes:
- Local development should use `DB_HOST=127.0.0.1` (preferred over `localhost`).
- Startup wrapper reads `.env` from the project root explicitly.

## 3. Start

```bash
npm run start:dev
```

Startup validates security-critical env configuration and fails fast on invalid settings.

Key endpoints:
- `GET /api/v1/healthz`
- `GET /api/v1/readyz`
- `GET /api/v1`
- `GET /api/v1/auth/me`
- `GET /api/v1/queue/health` (public)
- `GET /api/v1/queue/metrics`
- `GET /api/v1/queue/queues`
- `GET /api/v1/queue/queues/types`
- `GET /api/v1/queue/queues/:queueType/status`
- `GET /api/v1/queue/jobs/active`
- `GET /api/v1/queue/jobs/failed`
- `POST /api/v1/queue/jobs/demo`
- `GET /api/v1/queue/jobs/:jobId`
- `POST /api/v1/attachments`
- `GET /api/v1/attachments/entity/:entityType/:entityId`
- `GET /api/v1/attachments/:id`
- `DELETE /api/v1/attachments/:id`

Swagger is available at `/docs` when `SHOW_SWAGGER=true`.

## 4. Migration Behavior

- App startup runs pending migrations when `RUN_MIGRATIONS_ON_BOOT=true`.
- Expensive schema-diff validation is now opt-in with:
  - `DB_VERIFY_MIGRATION_DIFF=true`
- MySQL migrations run without forced transaction wrapping (`transactional/allOrNothing` disabled for MySQL).
- PostgreSQL requires an explicit schema via:
  - `--schema=<schema>` command option, or
  - `DB_SCHEMA` environment variable.
- Migration SQL generation can be filtered with:
  - `DB_MIGRATION_INCLUDED_TABLES` (comma-separated allow-list)
  - `DB_MIGRATION_EXCLUDED_SCHEMAS` (comma-separated block-list)

DB commands:

```bash
npm run db:migration:create -- --db=postgres --schema=public
npm run db:migration:up -- --db=mysql
npm run db:migration:down -- --db=mysql
npm run db:seed -- --db=postgres --schema=public
```

## 5. Proxy / Mail / Storage Configuration

- `PROXY_SERVICES_JSON`: service + endpoint map consumed by `ProxyService`
- Proxy hardening defaults:
  - `PROXY_ALLOW_BASE_URL_OVERRIDE=false`
  - `PROXY_ALLOW_DYNAMIC_CONFIG=false`
  - `PROXY_ALLOW_PRIVATE_IPS=false`
  - `PROXY_MAX_REDIRECTS=0`
- `MAIL_PROVIDER`: selects provider implementation
  - SES uses `EMAIL_SOURCE` (or fallback `MAIL_FROM_ADDRESS`) and AWS creds/region envs
  - SES requires `@aws-sdk/client-ses` installed in the project (`npm install @aws-sdk/client-ses`)
- `STORAGE_PROVIDER`: selects driver implementation
- `REDIS_ENABLED=true` enables BullMQ queue endpoints (Redis key/value controller is intentionally not exposed)
- `QUEUE_GENERAL_NAME` controls default queue name for demo/metrics endpoints
- `AttachmentModule` uses `StorageService` for upload/delete/signed URL handling
- Local attachment URLs are HMAC-signed; configure:
  - `ATTACHMENT_URL_SIGNING_SECRET`
- Multer storage mode is configurable: `ATTACHMENT_UPLOAD_STORAGE=memory|disk`

## 6. Throttle (Default)

- Global throttle guard is enabled by default.
- Defaults:
  - production-like: `100 requests / 60 seconds`
  - development: disabled (`THROTTLE_DEV_LIMIT=0`)
- When `REDIS_ENABLED=true`, throttle counters use Redis (`THROTTLE_USE_REDIS=true`) for multi-instance consistency.
- Endpoint-specific throttling example:
  - `POST /api/v1/queue/jobs/demo` uses `5 requests in 1 minute`.
## 7. Error Handling Convention

- Controllers: `try/catch` + `errorHandler.handleControllerError(...)`
- Services: `try/catch` + `throw errorHandler.handleServiceError(...)`

Reference files:
- `src/common/services/error-handler.service.ts`
- `src/common/decorators/api-ops.decorator.ts`
- `src/auth/auth.controller.ts`
- `src/attachment/attachment.controller.ts`

## 8. Quality

```bash
npm run lint:check
npm run typecheck
npm run test
npm run test:e2e
npm run build:app
```

## 9. Agent Rules

See [AGENTS.md](./AGENTS.md) for:
- permission mode policy
- plan -> execute -> verify workflow
- Git safety rules (`no commit/push` by agent)
- context and handoff guidance
