#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const DB_ALIASES = {
  postgres: 'postgresql',
  postgresql: 'postgresql',
  pg: 'postgresql',
  mysql: 'mysql',
  mariadb: 'mysql'
};

const BOOLEAN_ALIASES = {
  true: 'true',
  false: 'false',
  on: 'true',
  off: 'false',
  yes: 'true',
  no: 'false',
  '1': 'true',
  '0': 'false'
};

const STORAGE_ALIASES = {
  local: 'local',
  s3: 's3'
};

const MAIL_ALIASES = {
  console: 'console',
  sendgrid: 'sendgrid',
  smtp: 'smtp',
  ses: 'ses'
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

function normalizeDbClient(value) {
  const normalized = DB_ALIASES[String(value || 'postgresql').toLowerCase()];
  if (!normalized) {
    fail(`Unsupported --db value: ${value}`);
  }
  return normalized;
}

function normalizeBoolean(value, optionName, defaultValue = 'false') {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const normalized = BOOLEAN_ALIASES[String(value).toLowerCase()];
  if (!normalized) {
    fail(`Unsupported ${optionName} value: ${value}`);
  }
  return normalized;
}

function normalizeStorage(value) {
  const normalized = STORAGE_ALIASES[String(value || 'local').toLowerCase()];
  if (!normalized) {
    fail(`Unsupported --storage value: ${value}`);
  }
  return normalized;
}

function normalizeMail(value) {
  const normalized = MAIL_ALIASES[String(value || 'console').toLowerCase()];
  if (!normalized) {
    fail(`Unsupported --mail value: ${value}`);
  }
  return normalized;
}

function parseArgs(argv) {
  let dbClient = process.env.DB_CLIENT || 'postgresql';
  let dbSchema = process.env.DB_SCHEMA || 'public';
  let redisEnabled = process.env.REDIS_ENABLED || 'false';
  let storageProvider = process.env.STORAGE_PROVIDER || 'local';
  let mailProvider = process.env.MAIL_PROVIDER || 'console';
  let dockerEnabled = 'false';
  let envFile = '.env';

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg.startsWith('--db=')) {
      dbClient = arg.split('=')[1];
      continue;
    }

    if (arg === '--db') {
      dbClient = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--schema=')) {
      dbSchema = arg.split('=')[1];
      continue;
    }

    if (arg === '--schema') {
      dbSchema = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--redis=')) {
      redisEnabled = arg.split('=')[1];
      continue;
    }

    if (arg === '--redis') {
      const next = argv[index + 1];
      if (next && !next.startsWith('--')) {
        redisEnabled = next;
        index += 1;
      } else {
        redisEnabled = 'true';
      }
      continue;
    }

    if (arg === '--no-redis') {
      redisEnabled = 'false';
      continue;
    }

    if (arg.startsWith('--storage=')) {
      storageProvider = arg.split('=')[1];
      continue;
    }

    if (arg === '--storage') {
      storageProvider = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--mail=')) {
      mailProvider = arg.split('=')[1];
      continue;
    }

    if (arg === '--mail') {
      mailProvider = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--docker=')) {
      dockerEnabled = arg.split('=')[1];
      continue;
    }

    if (arg === '--docker') {
      const next = argv[index + 1];
      if (next && !next.startsWith('--')) {
        dockerEnabled = next;
        index += 1;
      } else {
        dockerEnabled = 'true';
      }
      continue;
    }

    if (arg.startsWith('--env=')) {
      envFile = arg.split('=')[1];
      continue;
    }

    if (arg === '--env') {
      envFile = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }

    fail(`Unknown argument: ${arg}`);
  }

  return {
    dbClient: normalizeDbClient(dbClient),
    dbSchema: String(dbSchema || '').trim(),
    redisEnabled: normalizeBoolean(redisEnabled, '--redis', 'false'),
    storageProvider: normalizeStorage(storageProvider),
    mailProvider: normalizeMail(mailProvider),
    dockerEnabled: normalizeBoolean(dockerEnabled, '--docker', 'false'),
    envFile
  };
}

function printHelp() {
  console.log(
    [
      'Usage:',
      '  npm run setup:profile -- --db=postgres --schema=public --redis=on --storage=local --mail=console --docker=on',
      '',
      'Options:',
      '  --db <postgres|postgresql|pg|mysql|mariadb>',
      '  --schema <schema>                  Required for postgres profile (defaults to public)',
      '  --redis <on|off|true|false|1|0>',
      '  --storage <local|s3>',
      '  --mail <console|sendgrid|smtp|ses>',
      '  --docker <on|off>                 Start required docker compose profiles',
      '  --env <path>                      Env file path (default: .env)'
    ].join('\n')
  );
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function upsertEnv(content, key, value) {
  const pattern = new RegExp(`^${escapeRegex(key)}=.*$`, 'm');
  const line = `${key}=${value}`;

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  const trimmed = content.trimEnd();
  return `${trimmed}\n${line}\n`;
}

function ensureEnvFile(repoRoot, envPath) {
  if (fs.existsSync(envPath)) {
    return;
  }

  const source = path.join(repoRoot, '.env.example');
  if (!fs.existsSync(source)) {
    fail('.env.example not found');
  }

  fs.copyFileSync(source, envPath);
}

function readPackageJson(repoRoot) {
  const packagePath = path.join(repoRoot, 'package.json');
  const raw = fs.readFileSync(packagePath, 'utf8');
  return JSON.parse(raw);
}

function hasDependency(packageJson, packageName) {
  return !!(
    packageJson.dependencies?.[packageName] ||
    packageJson.devDependencies?.[packageName]
  );
}

function startDockerProfiles(repoRoot, options) {
  const profiles = [];
  profiles.push(options.dbClient === 'postgresql' ? 'postgres' : 'mysql');

  if (options.redisEnabled === 'true') {
    profiles.push('redis');
  }

  if (profiles.length === 0) {
    return;
  }

  const args = profiles.flatMap(profile => ['--profile', profile]);
  args.push('up', '-d');

  const result = spawnSync('docker', ['compose', ...args], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    fail('Failed to start docker compose profiles.');
  }
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const options = parseArgs(process.argv.slice(2));
  const envPath = path.resolve(repoRoot, options.envFile);

  if (options.dbClient === 'postgresql' && !options.dbSchema) {
    fail('PostgreSQL profile requires --schema=<schema> (example: --schema=public)');
  }

  ensureEnvFile(repoRoot, envPath);
  let content = fs.readFileSync(envPath, 'utf8');

  const updates = {
    DB_CLIENT: options.dbClient,
    DB_PORT: options.dbClient === 'postgresql' ? '5432' : '3306',
    REDIS_ENABLED: options.redisEnabled,
    STORAGE_PROVIDER: options.storageProvider,
    MAIL_PROVIDER: options.mailProvider
  };

  if (options.dbClient === 'postgresql') {
    updates.DB_SCHEMA = options.dbSchema || 'public';
  }

  for (const [key, value] of Object.entries(updates)) {
    content = upsertEnv(content, key, value);
  }

  fs.writeFileSync(envPath, content, 'utf8');

  const packageJson = readPackageJson(repoRoot);
  if (options.mailProvider === 'ses' && !hasDependency(packageJson, '@aws-sdk/client-ses')) {
    console.warn('MAIL_PROVIDER=ses selected. Install SES SDK: npm install @aws-sdk/client-ses');
  }

  if (options.dockerEnabled === 'true') {
    startDockerProfiles(repoRoot, options);
  }

  console.log(`Updated ${path.relative(repoRoot, envPath)} with selected runtime profile.`);
  console.log(
    `Profile: db=${options.dbClient}, redis=${options.redisEnabled}, storage=${options.storageProvider}, mail=${options.mailProvider}`
  );
  console.log('Run: npm run start:dev');
}

main();
