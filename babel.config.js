module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Transform import.meta.* (used by zustand devtools and other ESM packages)
      // into process.env.* equivalents so Metro can bundle them as CommonJS.
      'babel-plugin-transform-import-meta',
    ],
  };
};
