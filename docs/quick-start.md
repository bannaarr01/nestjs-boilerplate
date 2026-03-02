# Quick Start

## 1. Clone and Install
```bash
git clone https://github.com/LLL-development/nestjs-boilerplate
cd nestjs-boilerplate
cp .env.example .env
npm install
```

If you want your app folder name immediately (e.g., you want your app name as user-management):
```bash
git clone https://github.com/LLL-development/nestjs-boilerplate user-management
cd user-management
cp .env.example .env
npm install
```

## 1.1 Rename/Rebrand (Recommended)
Update package and app branding so `nestjs-boilerplate` does not appear in runtime metadata.

```bash
# package name
npm pkg set name=user-management
```

Then edit `.env`:
```env
APP_NAME=user-management
APP_DESCRIPTION=User management service
```

Notes:
- `APP_NAME` is used by `GET /api/v1` and Swagger title.
- `APP_DESCRIPTION` is used in Swagger description.

## 2. Configure Runtime Once
This writes your selected profile into `.env`.

```bash
npm run setup:profile -- --db=postgres --schema=public --redis=off --storage=local --mail=console --docker=on
```

## 3. Start App
```bash
npm run start:dev
```

## 4. Verify
- API base: `http://localhost:8080/api/v1`
- Health: `GET /api/v1/healthz`
- Readiness: `GET /api/v1/readyz`
- Swagger (if `SHOW_SWAGGER=true`): `http://localhost:8080/docs`

## 5. Important Defaults
- `AUTH_DEMO_MODE=false` by default, so `POST /api/v1/auth/login` is disabled until you enable demo auth.
- API key guard is global. Add `x-api-key` for non-public endpoints.
- Redis is optional. Queue endpoints are mainly useful when Redis is enabled.
