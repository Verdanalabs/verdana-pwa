const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

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
