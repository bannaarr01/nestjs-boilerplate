# Runtime Profiles and Autowire Setup

`setup:profile` is the recommended way to set up this boilerplate.  
It updates `.env` once, so you can run with plain `npm run start:dev`.

## Command
```bash
npm run setup:profile -- --db=postgres --schema=public --redis=on --storage=local --mail=console --docker=on
```

## Supported Options
- `--db`: `postgres|postgresql|pg|mysql|mariadb`
- `--schema`: required for PostgreSQL profile
- `--redis`: `on|off|true|false|1|0|yes|no`
- `--storage`: `local|s3`
- `--mail`: `console|sendgrid|smtp|ses`
- `--docker`: `on|off` (starts needed docker compose profiles)
- `--env`: custom env path (default `.env`)

## What It Changes
- `DB_CLIENT`
- `DB_PORT`
- `DB_SCHEMA` (for PostgreSQL)
- `REDIS_ENABLED`
- `STORAGE_PROVIDER`
- `MAIL_PROVIDER`

Note:
- Startup wrapper resolves `.env` from project root (`tools/run-command-with-db.js`), so values are consistent regardless of shell working directory.

## Example Profiles

## Local Postgres + No Redis
```bash
npm run setup:profile -- --db=postgres --schema=public --redis=off --storage=local --mail=console --docker=on
```

## MySQL + Redis + SMTP
```bash
npm run setup:profile -- --db=mysql --redis=on --storage=local --mail=smtp --docker=on
```

## Postgres + SES + S3
```bash
npm run setup:profile -- --db=postgres --schema=public --redis=on --storage=s3 --mail=ses --docker=off
```

## SES Note
If `--mail=ses`, install dependency once:
```bash
npm install @aws-sdk/client-ses
```

## Optional Per-Run Overrides
You can still override at runtime if needed:
```bash
npm run start:dev -- --db=mysql --redis=off --storage=local --mail=console
```
