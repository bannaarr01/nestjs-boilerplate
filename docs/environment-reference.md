# Environment Reference

This file explains the most important env keys. See `.env.example` for full list.

## Comma-Separated Format
Some env keys are marked as comma-separated values.
This means a single string with values separated by commas.

Example:
```env
AUTH_DEMO_ROLES=admin,editor
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
DB_MIGRATION_INCLUDED_TABLES=attachments,users,orders
```

Notes:
- Spaces are optional. Values are trimmed by parser.
- An empty comma-separated value means "no values" (or fallback defaults depending on key).

## Core
- `PORT`: app port, default `8080`
- `NODE_ENV`: `development|production|staging|...`
- `APP_NAME`: application name shown in API info and Swagger title
- `APP_DESCRIPTION`: Swagger description text
- `SHOW_SWAGGER`: `true|false`
- `RUN_MIGRATIONS_ON_BOOT`: `true|false`
- `RUN_SEEDERS_ON_BOOT`: `true|false`

## Security and Auth
- `API_KEY`: required; used by global API key guard
- `JWT_SECRET`: required
- `JWT_EXPIRES_IN`: token expiry in seconds
- `AUTH_DEMO_MODE`: default `false`
- `AUTH_DEMO_EMAIL`: required if demo mode enabled
- `AUTH_DEMO_PASSWORD`: required if demo mode enabled
- `AUTH_DEMO_ROLES`: comma-separated roles for demo user. Example: `admin,manager`
- `AUTH_DEMO_PERMISSIONS`: comma-separated permissions for demo user. Example: `app:read,app:manage`

## CORS and Networking
- `TRUST_PROXY`: trust reverse proxy headers (`x-forwarded-for`)
- `CORS_ENABLED`
- `CORS_ORIGINS`: comma-separated origins. Example: `http://localhost:3000,http://localhost:5173`
- `CORS_METHODS`: comma-separated methods. Example: `GET,POST,PUT,DELETE,OPTIONS`
- `CORS_ALLOWED_HEADERS`: comma-separated headers. Example: `Content-Type,Authorization,x-api-key`
- `CORS_CREDENTIALS`

## Database
- `DB_CLIENT`: `postgresql|mysql`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
- `DB_SCHEMA`: required for PostgreSQL
- `DB_SSL`
- `DB_DEBUG`
- `DB_POOL_MIN`: minimum DB pool connections (default `0`)
- `DB_POOL_MAX`: maximum DB pool connections (default `10`)
- `DB_POOL_ACQUIRE_TIMEOUT_MS`: pool acquire timeout in ms (default `10000`)
- `DB_POOL_CREATE_TIMEOUT_MS`: pool create timeout in ms (default `5000`)
- `DB_POOL_IDLE_TIMEOUT_MS`: pool idle timeout in ms (default `30000`)

Local connection tip:
- Prefer `DB_HOST=127.0.0.1` for local machine startup.
- `localhost` is normalized to `127.0.0.1` internally to reduce resolver edge cases.

## Migrations
- `DB_MIGRATIONS_TABLE`
- `DB_MIGRATIONS_PATH`
- `DB_MIGRATIONS_PATH_TS`
- `DB_VERIFY_MIGRATION_DIFF`: opt-in migration diff check
- `DB_MIGRATION_INCLUDED_TABLES`: comma-separated allow-list for generated SQL. Example: `attachments,users`
- `DB_MIGRATION_EXCLUDED_SCHEMAS`: comma-separated block-list for generated SQL. Example: `user,learning`

## Redis and Queue
- `REDIS_ENABLED`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB`, `REDIS_USER`, `REDIS_PASS`
- `QUEUE_GENERAL_NAME`
- `QUEUE_JOB_REMOVE_ON_COMPLETE_AGE`
- `QUEUE_JOB_REMOVE_ON_FAIL_AGE`

## Throttle
- `THROTTLE_ENABLED`
- `THROTTLE_DEFAULT_LIMIT`
- `THROTTLE_DEFAULT_TTL_MS`
- `THROTTLE_USE_REDIS`
- `THROTTLE_DEV_LIMIT`
- `THROTTLE_DEV_TTL_MS`

## Storage and Attachment
- `STORAGE_PROVIDER`: `local|s3`
- `STORAGE_LOCAL_ROOT`
- `APP_BASE_URL`
- `ATTACHMENT_URL_SIGNING_SECRET`
- `ATTACHMENT_MAX_FILE_SIZE_BYTES`
- `ATTACHMENT_ALLOWED_MIME_TYPES`: comma-separated MIME list. Example: `application/pdf,image/jpeg,image/png`
- `ATTACHMENT_UPLOAD_STORAGE`: `memory|disk`
- `ATTACHMENT_UPLOAD_TEMP_DIR`

## AWS S3 / SES
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET_NAME`
- `EMAIL_SOURCE` (SES preferred sender)

## Mail
- `MAIL_PROVIDER`: `console|sendgrid|smtp|ses`
- `MAIL_FROM_ADDRESS`
- `MAIL_TEMPLATES_PATH`
- `SENDGRID_API_KEY`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`

## Proxy
- `PROXY_SERVICES_JSON`
- `PROXY_ALLOW_BASE_URL_OVERRIDE`
- `PROXY_ALLOW_DYNAMIC_CONFIG`
- `PROXY_ALLOW_PRIVATE_IPS`
- `PROXY_MAX_REDIRECTS`

## Best Practice
- Keep secrets in secret manager in production.
- Keep security defaults strict and only loosen with explicit reason.
- Keep provider-specific keys empty unless that provider is enabled.
