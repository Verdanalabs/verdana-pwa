const os = require('os');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');

const config = getDefaultConfig(__dirname);

// Give each variant its own Metro cache.
//
// Both variants build from this one directory, so with the default shared cache
// a second `expo start` reuses whatever the first compiled: the PVP server
// silently serves the collector bundle, app.json name and all, and the only
// clue is the wrong <title>. Keying the cache directory off the variant lets
// collector and pvp run side by side on different ports.
const appVariant = process.env.EXPO_PUBLIC_APP_VARIANT || 'collector';
config.cacheStores = [
  new FileStore({ root: path.join(os.tmpdir(), `metro-verdana-${appVariant}`) }),
];

// Enable package.json "exports" field resolution.
config.resolver.unstable_enablePackageExports = true;

// Condition names in priority order.
// 'react-native' first: packages like valtio have a react-native → CJS export,
// which avoids their ESM builds that contain `import.meta`.
// 'browser'/'require'/'default' as fallbacks also prefer CJS over ESM.
config.resolver.unstable_conditionNames = [
  'react-native',
  'browser',
  'require',
  'default',
];

// uuid v9's wrapper.mjs imports the Node.js CJS build which needs native crypto.
// Redirect all uuid imports to the browser-compatible ESM build instead.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'uuid') {
    const originDir = path.dirname(context.originModulePath);
    try {
      const pkgJsonPath = require.resolve('uuid/package.json', {
        paths: [originDir, __dirname],
      });
      const uuidDir = path.dirname(pkgJsonPath);
      return {
        filePath: path.join(uuidDir, 'dist', 'esm-browser', 'index.js'),
        type: 'sourceFile',
      };
    } catch {
      // fall through to default resolution
    }
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
