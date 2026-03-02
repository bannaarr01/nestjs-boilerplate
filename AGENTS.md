# AGENTS.md

## Project Purpose
Reusable NestJS boilerplate`.

## Core Stack
- NestJS 10 + TypeScript
- MikroORM 6
- PostgreSQL or MySQL (runtime switch)
- Optional Redis + BullMQ
- JWT auth module + global API key guard (`x-api-key`)
- Global throttle guard with per-endpoint override support
- Centralized error handling (`ErrorHandlerService`)

## Permission Modes
Use the safest mode that still allows progress:
- `Plan Mode`: read-only analysis and planning only
- `Normal Mode` (recommended): confirm every edit and command
- `AcceptEdits Mode`: auto-approve edits, confirm commands
- `Auto Accept Mode`: auto-approve all actions; avoid for general use

## Operating Workflow
Always follow this sequence:
1. Requirements definition
2. Plan
3. Task breakdown
4. Execute one logical unit
5. Verify (typecheck/lint/tests + manual test checklist)

Rules:
- Do not jump into code for large tasks without a plan.
- Break large work into small tasks; use task files (`tasks.md`, `plan.md`) for long efforts.
- For multi-session work, maintain `HANDOFF.md`.

## Git Operation Rules
IMPORTANT:
- Do not run `git commit` or `git push`.
- Allowed Git operations:
  - read-only: `git status`, `git diff`, `git log`, `git show`
  - branch creation/switch: `git branch`, `git checkout -b`
  - temporary stashing: `git stash`
- Developer reviews diffs and performs commit/push manually.

## Code and Architecture Rules
- Keep controllers/services wrapped in `try/catch` and route all errors through `ErrorHandlerService`.
- Keep API key guard mandatory and globally registered.
- Keep decorators/util patterns consistent (`ApiOperationAndResponses`, `Role`, `ResourcePermission`, `Public`).
- Keep code generic and template-safe; avoid domain-specific business logic.
- Keep local attachment URLs signed (`ATTACHMENT_URL_SIGNING_SECRET`) and do not expose unsigned local file access.
- Keep demo auth claims controlled by env only (`AUTH_DEMO_ROLES`, `AUTH_DEMO_PERMISSIONS`), never request body.
- Keep demo auth disabled by default (`AUTH_DEMO_MODE=false`) and enable only for local/dev bootstrapping.
- Prefer standard DB env keys:
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
  - `DB_SCHEMA` required for PostgreSQL

## Runtime and DB Commands
```bash
npm run setup:profile -- --db=postgres --schema=public --redis=off --storage=local --mail=console --docker=on
npm run start:dev
npm run start:dev -- --db=postgres --schema=public --redis=off --storage=local --mail=console
npm run start:dev -- --db=mysql --redis=on --storage=s3 --mail=smtp
npm run start:dev -- --db=postgres --schema=public --redis=off --storage=local --mail=ses
```

SES note:
- if using `--mail=ses`, install `@aws-sdk/client-ses` in the project.

```bash
npm run db:migration:create -- --db=postgres --schema=public
npm run db:migration:up -- --db=mysql
npm run db:migration:down -- --db=mysql
npm run db:seed -- --db=postgres --schema=public
```

## Migration Notes
- Startup applies pending migrations only.
- Schema diff check is opt-in: `DB_VERIFY_MIGRATION_DIFF=true`.
- MySQL migration uses non-transactional generation defaults where appropriate.
- Custom migration generator supports:
  - include tables: `DB_MIGRATION_INCLUDED_TABLES`
  - exclude schemas: `DB_MIGRATION_EXCLUDED_SCHEMAS`
- SQL formatting is dialect-aware (PostgreSQL/MySQL).

## Verification Policy
After each implementation task:
- run `npm run typecheck`
- run `npm run lint:check`
- run related tests (`npm run test`, `npm run test:e2e` when relevant)
- provide manual test checklist for developer-side verification

## Queue and Throttle Defaults
- Redis/BullMQ is opt-in via `REDIS_ENABLED=true` or `--redis=on`.
- Use queue endpoints (`/api/v1/queue/*`) for Redis/BullMQ operations; no standalone Redis key-value controller is exposed.
- Global throttling is enabled by default:
  - production-like default: `100 requests / 60s`
  - development default: disabled (`THROTTLE_DEV_LIMIT=0`)
- For multi-instance deployments, keep `THROTTLE_USE_REDIS=true` with `REDIS_ENABLED=true`.
- Example endpoint-level throttle is applied on queue demo enqueue endpoint (`5 requests in 1 minute`).

## Context Management
- Keep prompts scoped and explicit.
- Reference specific files to avoid irrelevant exploration.
- For Claude: use `/compact` and `/clear` between unrelated tasks.
- For Codex: start new sessions/threads for unrelated work.

## Shared Skills
Project skills live under `.claude/skills`:
- `sort-imports`
- `typescript-review`
- `security-audit`

To register these skills into Codex one time:
- macOS/Linux: `bash scripts/setup-codex-skills.sh`
- Windows (PowerShell): `pwsh -File .\\scripts\\setup-codex-skills.ps1`

## Key Files
- App root: `src/app.module.ts`
- Bootstrap: `src/main.ts`
- ORM config: `src/config/database/mikro-orm.config.ts`
- Queue module: `src/queue/queue.module.ts`
- Queue controller: `src/queue/queue.controller.ts`
- Queue service: `src/queue/queue.service.ts`
- Throttle guard: `src/common/guards/throttle.guard.ts`
- Throttle decorator: `src/common/decorators/throttle.decorator.ts`
- Custom migration generator: `src/database/migrations/custom-migration.generator.ts`
- Migration service: `src/database/migrations/db-migration.service.ts`
- Auth config/guards/decorators: `src/auth`, `src/common/decorators`, `src/common/guards`
- Error handler: `src/common/services/error-handler.service.ts`
- Multer config: `src/config/storage/multer-storage.config.ts`
- Runtime switch script: `tools/run-command-with-db.js`
