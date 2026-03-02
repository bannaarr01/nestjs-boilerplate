# Database and Migrations

## Supported Clients
- PostgreSQL
- MySQL

Use common env keys:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
- `DB_SCHEMA` required for PostgreSQL

## Config File
- `src/config/database/mikro-orm.config.ts`

Highlights:
- `TsMorphMetadataProvider` enabled
- `entitiesTs: ['src/**/*.entity.ts']`
- dialect-specific migration behavior

## Migration Service
- `src/database/migrations/db-migration.service.ts`
- Runs pending migrations on boot when `RUN_MIGRATIONS_ON_BOOT=true`
- Optional schema diff check with `DB_VERIFY_MIGRATION_DIFF=true`

## Custom Migration Generator
- `src/database/migrations/custom-migration.generator.ts`
- Features:
  - SQL formatting for PostgreSQL/MySQL
  - optional table include filtering (`DB_MIGRATION_INCLUDED_TABLES`)
  - optional schema exclude filtering (`DB_MIGRATION_EXCLUDED_SCHEMAS`)

## Commands
```bash
npm run db:migration:create -- --db=postgres --schema=public
npm run db:migration:up -- --db=mysql
npm run db:migration:down -- --db=mysql
npm run db:seed -- --db=postgres --schema=public
```

## Recommended Workflow
1. Run `setup:profile` for target DB.
2. Create migration from entity changes.
3. Review generated migration.
4. Apply migration.
5. Seed only with explicit intent.
