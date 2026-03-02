# Troubleshooting

## App fails with `DB_SCHEMA is required when DB_CLIENT=postgresql`
Set one of:
- `.env` contains `DB_SCHEMA=public` (or your schema)
- run startup with `--schema=<schema>`

Recommended fix:
```bash
npm run setup:profile -- --db=postgres --schema=public
```

## `Invalid or missing API key`
- Ensure request contains `x-api-key` header.
- Ensure `API_KEY` exists in env.
- Public endpoints marked with `@Public()` do not require API key.

## `/auth/login` returns disabled/forbidden
- `AUTH_DEMO_MODE` is off by default.
- Enable only for local/demo and set:
  - `AUTH_DEMO_EMAIL`
  - `AUTH_DEMO_PASSWORD`

## Queue endpoints fail with Redis unavailable
- Set `REDIS_ENABLED=true`
- Verify Redis host/port/auth
- Or disable Redis and avoid queue endpoints

## SES provider errors
- Install package:
```bash
npm install @aws-sdk/client-ses
```
- Set `AWS_REGION`
- Set `EMAIL_SOURCE` or `MAIL_FROM_ADDRESS`
- Set AWS credentials or use IAM role

## Attachment signed URL fails
- Check `ATTACHMENT_URL_SIGNING_SECRET`
- Ensure URL not expired (`expires`)
- Ensure signature query (`sig`) is intact
- Ensure `APP_BASE_URL` is correct for local provider

## CORS blocked requests
- Set `CORS_ENABLED=true`
- Add frontend origin to `CORS_ORIGINS`
- Confirm methods/headers allow your request

## Proxy request blocked
- By default private/local hosts are blocked.
- Review proxy policy env flags before changing defaults.
