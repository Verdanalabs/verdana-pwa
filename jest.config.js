module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Some dependencies (e.g. @privy-io and the uuid build it pulls in) ship ESM
  // that must be transpiled. Extend jest-expo's default allowlist so they are not
  // skipped by the node_modules transform ignore.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@privy-io/.*|uuid|ofetch|node-fetch-native|destr|ufo))',
  ],
};
