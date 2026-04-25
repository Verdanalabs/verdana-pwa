#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
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
const env = {
  ...process.env,
  EXPO_PUBLIC_APP_VARIANT: variant,
};

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

run('npx', ['expo', 'export', '--platform', 'web']);
run(process.execPath, [path.join(scriptDir, 'configure-web-build.mjs'), variant]);
