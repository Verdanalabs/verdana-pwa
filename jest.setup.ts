// AsyncStorage's native module is null outside a running app, so any module that
// imports it fails at import time rather than at first use. The package ships an
// in-memory implementation for exactly this.
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-image', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Image } = require('react-native');

  return {
    Image: (props: object) => React.createElement(Image, props),
  };
});

jest.mock('expo-linear-gradient', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');

  return {
    LinearGradient: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

jest.mock('@expo/vector-icons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');

  const Ionicons = ({ name, ...props }: { name?: string }) => React.createElement(Text, props, name ?? 'icon');
  Ionicons.glyphMap = {};

  return { Ionicons };
});

// @privy-io/react-auth ships an ESM-only dependency chain (ofetch, uuid, ...)
// that Jest cannot load. The app only consumes these three exports, so stub them
// to keep auth-dependent screens renderable in tests.
jest.mock('@privy-io/react-auth', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    PrivyProvider: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    usePrivy: () => ({
      ready: true,
      authenticated: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      getAccessToken: jest.fn(async () => null),
    }),
    useLogout: () => ({ logout: jest.fn() }),
  };
});

// app-variant.ts reads window.location.hostname at import time to detect the
// collector/PVP build. The test environment may leave window.location unset, so
// provide a benign default that resolves to the collector variant.
if (typeof window !== 'undefined' && (!window.location || !window.location.hostname)) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { hostname: 'localhost', href: 'http://localhost/', origin: 'http://localhost' },
  });
}
