#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const variant = process.argv[2];
const validVariants = new Set(['collector', 'pvp']);

if (!validVariants.has(variant)) {
  console.error('Usage: node ./scripts/configure-web-build.mjs <collector|pvp>');
  process.exit(1);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const buildOutputDir = path.join(rootDir, 'dist');

const variantConfig = {
  collector: {
    name: 'Verdana App',
    shortName: 'Verdana App',
    description: 'Mobile operational app for suppliers and collectors.',
    themeColor: '#070e07',
    backgroundColor: '#070e07',
    cacheName: 'verdana-collector-v1',
  },
  pvp: {
    name: 'Verdana PVP',
    shortName: 'Verdana PVP',
    description: 'Mobile operational app for PVP operators and drop-off point teams.',
    themeColor: '#070e07',
    backgroundColor: '#070e07',
    cacheName: 'verdana-pvp-v1',
  },
}[variant];

const webManifest = {
  name: variantConfig.name,
  short_name: variantConfig.shortName,
  description: variantConfig.description,
  lang: 'en',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: variantConfig.backgroundColor,
  theme_color: variantConfig.themeColor,
  icons: [
    {
      src: '/icon-192.svg',
      sizes: '192x192',
      type: 'image/svg+xml',
      purpose: 'any',
    },
    {
      src: '/icon-512.svg',
      sizes: '512x512',
      type: 'image/svg+xml',
      purpose: 'any',
    },
    {
      src: '/icon-512.svg',
      sizes: '512x512',
      type: 'image/svg+xml',
      purpose: 'maskable',
    },
  ],
};

const serviceWorkerSource = `const CACHE_NAME = '${variantConfig.cacheName}';
const APP_SHELL = ['/', '/manifest.webmanifest', '/icon-192.svg', '/icon-512.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const isNavigationRequest = event.request.mode === 'navigate';

  if (isNavigationRequest) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return response;
      });
    })
  );
});
`;

function rewriteWebAssets() {
  const assetsRoot = path.join(buildOutputDir, 'assets');
  const oldDir = path.join(assetsRoot, 'node_modules');
  const newDir = path.join(assetsRoot, 'vendor');

  if (!fs.existsSync(oldDir)) {
    return;
  }

  fs.rmSync(newDir, { recursive: true, force: true });
  fs.renameSync(oldDir, newDir);

  const replaceExtensions = new Set(['.html', '.js', '.map', '.css']);

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!replaceExtensions.has(path.extname(entry.name))) {
        continue;
      }

      const source = fs.readFileSync(fullPath, 'utf8');
      const next = source.split('/assets/node_modules/').join('/assets/vendor/');

      if (next !== source) {
        fs.writeFileSync(fullPath, next);
      }
    }
  }

  walk(buildOutputDir);
}

fs.writeFileSync(
  path.join(buildOutputDir, 'manifest.webmanifest'),
  `${JSON.stringify(webManifest, null, 2)}\n`,
);
fs.writeFileSync(path.join(buildOutputDir, 'service-worker.js'), serviceWorkerSource);
rewriteWebAssets();
