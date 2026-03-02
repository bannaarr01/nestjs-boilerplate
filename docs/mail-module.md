# Mail Module

## Supported Providers
- `console`
- `sendgrid`
- `smtp`
- `ses`

Files:
- `src/mail/mail.module.ts`
- `src/mail/mail.service.ts`
- `src/mail/providers/*`
- `src/mail/mail-template.service.ts`

## Provider Configuration

## Console
- `MAIL_PROVIDER=console`
- No external credentials required

## SendGrid
- `MAIL_PROVIDER=sendgrid`
- `SENDGRID_API_KEY`
- `MAIL_FROM_ADDRESS`

## SMTP
- `MAIL_PROVIDER=smtp`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- optional `SMTP_USER`, `SMTP_PASS`
- `MAIL_FROM_ADDRESS`

## SES
- `MAIL_PROVIDER=ses`
- `AWS_REGION`
- optional static AWS keys (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- `EMAIL_SOURCE` (preferred) or `MAIL_FROM_ADDRESS`
- install dependency:
```bash
npm install @aws-sdk/client-ses
```

## Template Rendering
- Templates are loaded from `MAIL_TEMPLATES_PATH` (default `mail-templates`).
- Template name is sanitized before file access.

## Recommendation
- Keep provider choice in env.
- Start with `console` provider in local development.
