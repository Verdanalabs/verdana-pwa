#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const variant = process.argv[2];
const validVariants = new Set(['collector', 'pvp']);

if (!validVariants.has(variant)) {
  console.error('Usage: node ./scripts/build-web-variant.mjs <collector|pvp>');
  process.exit(1);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const envFilePath = process.env.VERDANA_EXPO_ENV_FILE
  ? path.resolve(rootDir, process.env.VERDANA_EXPO_ENV_FILE)
  : null;
const tempExpoEnvPath = path.join(rootDir, '.env.local');

const env = {
  ...process.env,
  EXPO_PUBLIC_APP_VARIANT: variant,
};

function parseDotenvFile(filePath) {
  const output = {};
  const source = fs.readFileSync(filePath, 'utf8');

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    output[key] = value;
  }

  return output;
}

function withExpoPublicEnvFile(runBuild) {
  const existingEnvLocal = fs.existsSync(tempExpoEnvPath)
    ? fs.readFileSync(tempExpoEnvPath, 'utf8')
    : null;

  try {
    if (envFilePath) {
      const parsed = parseDotenvFile(envFilePath);
      const expoPublicEntries = Object.entries(parsed)
        .filter(([key]) => key.startsWith('EXPO_PUBLIC_'))
        .concat([['EXPO_PUBLIC_APP_VARIANT', variant]]);

      const body = expoPublicEntries
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      fs.writeFileSync(tempExpoEnvPath, `${body}\n`);
    }

    runBuild();
  } finally {
    if (existingEnvLocal === null) {
      fs.rmSync(tempExpoEnvPath, { force: true });
    } else {
      fs.writeFileSync(tempExpoEnvPath, existingEnvLocal);
    }
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

withExpoPublicEnvFile(() => {
  run('npx', ['expo', 'export', '--platform', 'web']);
});
run(process.execPath, [path.join(scriptDir, 'configure-web-build.mjs'), variant]);
