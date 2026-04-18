# AGENTS.md - NestJS Boilerplate

Guidance for AI agents (Claude, Codex, Gemini, Copilot, etc.) working in this repository.

## Workflow Orchestration

### 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions).
- If something goes sideways, STOP and re-plan immediately — don't keep pushing.
- Use plan mode for verification steps, not just building.
- Write detailed specs upfront to reduce ambiguity.

### 2. Recommended Cycle

```
Requirements -> Plan -> Task Breakdown -> Execute -> Verify
```

1. Plan first for medium/large tasks.
2. Break work into small units (`tasks/todo.md` for larger sessions).
3. Execute one logical unit per diff.
4. Verify with typecheck/lint/tests as far as possible.
5. For long-running sessions, maintain `HANDOFF.md`.

### 3. Subagent Strategy

- Use subagents liberally to keep the main context window clean.
- Offload research, exploration, and parallel analysis to subagents.
- For complex problems, throw more compute at it via subagents.
- One task per subagent for focused execution.

### 4. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern.
- Write rules for yourself that prevent the same mistake.
- Ruthlessly iterate on these lessons until mistake rate drops.
- Review lessons at session start for relevant context.

### 5. Verification Before Done

- Never mark a task complete without proving it works.
- Diff behavior between main and your changes when relevant.
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness.

### 6. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution."
- Skip this for simple, obvious fixes — don't over-engineer.
- Challenge your own work before presenting it.

### 7. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding.
- Point at logs, errors, failing tests — then resolve them.
- Zero context switching required from the user.
- Go fix failing CI tests without being told how.

## Task Management

- **Plan First**: Write plan to `tasks/todo.md` with checkable items.
- **Verify Plan**: Check in before starting implementation.
- **Track Progress**: Mark items complete as you go.
- **Explain Changes**: High-level summary at each step.
- **Document Results**: Add review section to `tasks/todo.md`.
- **Capture Lessons**: Update `tasks/lessons.md` after corrections.

## Git Rules

IMPORTANT: Do not execute `git commit` or `git push` automatically.

- Allowed read-only git: `git status`, `git diff`, `git log`, `git show`
- Allowed branch operations: `git branch`, `git checkout -b`
- Allowed temporary stashing: `git stash`
- Developer performs commit/push after reviewing the diff

## Project Summary

Reusable NestJS 11 + MikroORM 6 boilerplate with:
- Keycloak auth (`nestjs-keycloak-auth`) + API key guard (`x-api-key`)
- PostgreSQL/MySQL runtime switch
- Optional Redis/BullMQ queue stack
- Storage abstraction (`local`/`s3`)
- Mail abstraction (`console`/`sendgrid`/`smtp`/`ses`)
- Proxy module for service endpoint forwarding
- Centralized error handling and migration/seeding services

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 |
| Framework | NestJS 11 + TypeScript 5 |
| ORM | MikroORM 6 |
| Auth | Keycloak + API key guard |
| Validation | `class-validator` + `class-transformer` |
| API Docs | `@nestjs/swagger` |
| Logging | Winston + `winston-daily-rotate-file` |
| Testing | Jest + `ts-jest` |
| Container | Docker multi-stage + Compose |
| CI/CD | GitLab CI |

## Repository Layout

```
src/
|- main.ts
|- app.module.ts
|- app.controller.ts
|- auth/                          # Keycloak user-context endpoint(s)
|- attachment/                    # Upload/list/get/delete attachment metadata/files
|- queue/                         # BullMQ metrics and job endpoints
|- proxy/                         # Proxy endpoint forwarding
|- mail/                          # Mail providers and templating
|- storage/                       # Local/S3 storage driver abstraction
|- common/                        # Errors, guards, filters, decorators, enums
|- config/
|  |- auth/auth-config.module.ts  # Keycloak global guards registration
|  |- database/mikro-orm.config.ts
|  |- queue/redis/storage/throttle
|- database/
|  |- migrations/
|  |- seeders/
|- logging/
|- utils/

tasks/
|- todo.md      # Active task plan with checkable items
|- lessons.md   # Accumulated lessons from corrections
```

## Architectural Conventions

1. Controllers and services use `try/catch` and route errors via `ErrorHandlerService`.
2. Keep response shape consistent using `ApiResponse<T>`.
3. Prefer explicit DTOs for request/response.
4. Use Keycloak decorators from `nestjs-keycloak-auth` (`Public`, `Roles`, `AuthenticatedUser`).
5. Keep feature modules generic/template-safe; avoid domain-specific coupling.
6. Keep migration generation deterministic and review generated SQL.

## Auth Conventions (Keycloak)

- Global auth wiring lives in `src/config/auth/auth-config.module.ts`.
- Guards order:
  - `ThrottleGuard` (when enabled)
  - `ApiKeyGuard`
  - `AuthGuard`
  - `ResourceGuard`
  - `RoleGuard`
- Required API key env:
  - `API_KEY`
- Required env keys:
  - `KEYCLOAK_BASE_URL`
  - `KEYCLOAK_REALM`
  - `KEYCLOAK_CLIENT_ID`
- Optional env keys:
  - `KEYCLOAK_CLIENT_SECRET`
  - `KEYCLOAK_PUBLIC_KEY`

## Runtime and DB Commands

```bash
npm run start:dev
npm run build
npm run test
npm run test:cov
npm run lint
npm run typecheck
npm run db:migration:create
npm run db:migration:up
npm run db:migration:down
npm run db:seed
```

## Verification Policy

After each implementation task (when possible):
- `npm run typecheck`
- `npm run lint:check`
- relevant tests (`npm run test`, `npm run test:e2e` if applicable)
- include a manual verification checklist for flows that cannot be validated headlessly

## Skills

Project skills live under `.claude/skills`.

Primary reusable workflows:
- `add-module`
- `add-endpoint`
- `add-migration`
- `add-test`
- `review`
- `sort-imports`
- `handoff`
- `security-audit`
- `typescript-review`

## Key Files

- App root: `src/app.module.ts`
- Bootstrap: `src/main.ts`
- Auth config: `src/config/auth/auth-config.module.ts`
- Auth module: `src/auth`
- ORM config: `src/config/database/mikro-orm.config.ts`
- Migration service: `src/database/migrations/db-migration.service.ts`
- Error handling: `src/common/services/error-handler.service.ts`
- Queue: `src/queue`
- Storage: `src/storage`
- Mail: `src/mail`
- Active tasks: `tasks/todo.md`
- Lessons learned: `tasks/lessons.md`
