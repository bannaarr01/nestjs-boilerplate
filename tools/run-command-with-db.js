#!/usr/bin/env node

const { spawn } = require('node:child_process');
const dotenv = require('dotenv');

dotenv.config({ quiet: true });

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

function normalizeDbClient(rawValue) {
  if (!rawValue) {
    return 'postgresql';
  }

  const normalized = DB_ALIASES[String(rawValue).toLowerCase()];
  if (!normalized) {
    const supported = Object.keys(DB_ALIASES).join(', ');
    throw new Error(`Unsupported --db value: "${rawValue}". Supported values: ${supported}`);
  }

  return normalized;
}

function normalizeBooleanOption(rawValue, optionName, defaultValue) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return defaultValue;
  }

  const normalized = BOOLEAN_ALIASES[String(rawValue).toLowerCase()];
  if (!normalized) {
    const supported = Object.keys(BOOLEAN_ALIASES).join(', ');
    throw new Error(`Unsupported ${optionName} value: "${rawValue}". Supported values: ${supported}`);
  }

  return normalized;
}

function normalizeStorageProvider(rawValue) {
  if (!rawValue) {
    return 'local';
  }

  const normalized = STORAGE_ALIASES[String(rawValue).toLowerCase()];
  if (!normalized) {
    const supported = Object.keys(STORAGE_ALIASES).join(', ');
    throw new Error(`Unsupported --storage value: "${rawValue}". Supported values: ${supported}`);
  }

  return normalized;
}

function normalizeMailProvider(rawValue) {
  if (!rawValue) {
    return 'console';
  }

  const normalized = MAIL_ALIASES[String(rawValue).toLowerCase()];
  if (!normalized) {
    const supported = Object.keys(MAIL_ALIASES).join(', ');
    throw new Error(`Unsupported --mail value: "${rawValue}". Supported values: ${supported}`);
  }

  return normalized;
}

function parseArgs(argv) {
  const commandArgs = [];
  let dbClient = process.env.DB_CLIENT;
  let dbSchema = process.env.DB_SCHEMA;
  let redisEnabled = process.env.REDIS_ENABLED;
  let storageProvider = process.env.STORAGE_PROVIDER;
  let mailProvider = process.env.MAIL_PROVIDER;

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

    if (arg === '--no-redis') {
      redisEnabled = 'false';
      continue;
    }

    if (arg.startsWith('--redis=')) {
      redisEnabled = arg.split('=')[1];
      continue;
    }

    if (arg === '--redis') {
      const nextArg = argv[index + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        redisEnabled = nextArg;
        index += 1;
      } else {
        redisEnabled = 'true';
      }
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

    commandArgs.push(arg);
  }

  return {
    commandArgs,
    dbClient: normalizeDbClient(dbClient),
    dbSchema,
    redisEnabled: normalizeBooleanOption(redisEnabled, '--redis', 'false'),
    storageProvider: normalizeStorageProvider(storageProvider),
    mailProvider: normalizeMailProvider(mailProvider)
  };
}

let commandArgs;
let dbClient;
let dbSchema;
let redisEnabled;
let storageProvider;
let mailProvider;

try {
  ({ commandArgs, dbClient, dbSchema, redisEnabled, storageProvider, mailProvider } = parseArgs(process.argv.slice(2)));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

if (dbClient === 'postgresql' && (!dbSchema || !String(dbSchema).trim())) {
  console.error('PostgreSQL requires --schema=<schema> or DB_SCHEMA in environment.');
  process.exit(1);
}

if (commandArgs.length === 0) {
  console.error(
    'No command provided. Example: node tools/run-command-with-db.js nest start --watch --db=postgres --schema=public --redis=off --storage=local --mail=console'
  );
  process.exit(1);
}

const [command, ...args] = commandArgs;
const child = spawn(command, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    DB_CLIENT: dbClient,
    DB_SCHEMA: dbSchema,
    REDIS_ENABLED: redisEnabled,
    STORAGE_PROVIDER: storageProvider,
    MAIL_PROVIDER: mailProvider
  }
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
