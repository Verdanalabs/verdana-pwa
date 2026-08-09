import React from 'react';
import { render, screen } from '@testing-library/react-native';
import IndexRoute from '@/app/index';
import AuthLayout from '@/app/(auth)/_layout';
import PvpTabsLayout from '@/app/(pvp-tabs)/_layout';
import { useAuth } from '@/src/features/auth/state/auth-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';

// appVariant is resolved once at import time from the hostname, so a test can
// never reach it by setting an env var. Every guard in this file branches on it
// first, which meant all the PVP cases below were silently running as the
// collector build and asserting against the wrong branch. The getter lets each
// test pick the variant it means to exercise.
let mockAppVariant: 'collector' | 'pvp' = 'collector';

jest.mock('@/src/shared/config/app-variant', () => ({
  get appVariant() {
    return mockAppVariant;
  },
  getAuthenticatedHref: (variant: 'collector' | 'pvp') =>
    variant === 'collector' ? '/(supplier-tabs)/home' : '/(pvp-tabs)/dashboard',
  getGuestEntryHref: (variant: 'collector' | 'pvp') =>
    variant === 'collector' ? '/(auth)/welcome' : '/(auth)/pvp-login',
}));

jest.mock('@/src/features/auth/state/auth-context', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/src/features/pvp/state/pvp-auth-context', () => ({
  usePvpAuth: jest.fn(),
}));

jest.mock('@/src/shared/navigation/PvpTabBar', () => ({
  PvpCustomTabBar: Object.assign(() => null, { displayName: 'PvpCustomTabBar' }),
}));

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactLocal = require('react');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text, View } = require('react-native');

  const Redirect = ({ href }: { href: string }) => ReactLocal.createElement(Text, { testID: 'redirect' }, href);
  Redirect.displayName = 'Redirect';
  const Stack = ({ children }: { children?: React.ReactNode }) => ReactLocal.createElement(View, { testID: 'stack' }, children);
  Stack.displayName = 'Stack';
  const Tabs = ({ children }: { children?: React.ReactNode }) => ReactLocal.createElement(View, { testID: 'tabs' }, children);
  Tabs.displayName = 'Tabs';
  Tabs.Screen = Object.assign(() => null, { displayName: 'Tabs.Screen' });

  return { Redirect, Stack, Tabs };
});

const mockUseAuth = useAuth as jest.Mock;
const mockUsePvpAuth = usePvpAuth as jest.Mock;

function redirectTarget() {
  return screen.getByTestId('redirect').props.children;
}

describe('route guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAppVariant = 'collector';
    // The collector index returns null until Privy reports ready, so a mock
    // that omits isReady renders nothing and every assertion misses.
    mockUseAuth.mockReturnValue({ isReady: true, isAuthenticated: false, needsOnboarding: false });
    mockUsePvpAuth.mockReturnValue({ state: 'idle' });
  });

  describe('collector build', () => {
    it('sends an unauthenticated session to welcome from root', () => {
      render(<IndexRoute />);

      expect(redirectTarget()).toBe('/(auth)/welcome');
    });

    it('holds the redirect until Privy reports ready', () => {
      mockUseAuth.mockReturnValue({ isReady: false, isAuthenticated: false, needsOnboarding: false });

      render(<IndexRoute />);

      expect(screen.queryByTestId('redirect')).toBeNull();
    });

    it('sends an onboarded session to the supplier tabs from root', () => {
      mockUseAuth.mockReturnValue({ isReady: true, isAuthenticated: true, needsOnboarding: false });

      render(<IndexRoute />);

      expect(redirectTarget()).toBe('/(supplier-tabs)/home');
    });

    it('sends a session that still needs onboarding to the profile step', () => {
      mockUseAuth.mockReturnValue({ isReady: true, isAuthenticated: true, needsOnboarding: true });

      render(<IndexRoute />);

      expect(redirectTarget()).toBe('/(auth)/onboarding-profile');
    });

    it('redirects authenticated suppliers away from auth routes', () => {
      mockUseAuth.mockReturnValue({ isReady: true, isAuthenticated: true, needsOnboarding: false });

      render(<AuthLayout />);

      expect(redirectTarget()).toBe('/(supplier-tabs)/home');
    });

    it('keeps the PVP tab group out of the collector build', () => {
      mockUsePvpAuth.mockReturnValue({ state: 'active' });

      render(<PvpTabsLayout />);

      expect(redirectTarget()).toBe('/');
    });
  });

  describe('pvp build', () => {
    beforeEach(() => {
      mockAppVariant = 'pvp';
    });

    it('sends an active session to the PVP dashboard from root', () => {
      mockUsePvpAuth.mockReturnValue({ state: 'active' });

      render(<IndexRoute />);

      expect(redirectTarget()).toBe('/(pvp-tabs)/dashboard');
    });

    it('sends a signed-in session with no processor record to onboarding', () => {
      mockUsePvpAuth.mockReturnValue({ state: 'authenticated' });

      render(<IndexRoute />);

      expect(redirectTarget()).toBe('/pvp/onboarding');
    });

    it('sends an idle session to the PVP login from root', () => {
      mockUsePvpAuth.mockReturnValue({ state: 'idle' });

      render(<IndexRoute />);

      expect(redirectTarget()).toBe('/(auth)/pvp-login');
    });

    it('sends an idle session to the PVP login from the tab group', () => {
      mockUsePvpAuth.mockReturnValue({ state: 'idle' });

      render(<PvpTabsLayout />);

      expect(redirectTarget()).toBe('/(auth)/pvp-login');
    });

    it('renders PVP tabs for active sessions', () => {
      mockUsePvpAuth.mockReturnValue({ state: 'active' });

      render(<PvpTabsLayout />);

      expect(screen.getByTestId('tabs')).toBeTruthy();
    });

    // The layout deliberately does not bounce a pending operator: app/pvp/_layout.tsx
    // records the rule that layouts keep one navigator and screens own per-state
    // navigation. A pending operator reaches /pvp/pending-approval through
    // PvpLoginScreen, and the API rejects their requests regardless. Asserting a
    // redirect here would contradict that rule, so this pins the actual contract.
    it('leaves per-state navigation to the screens for a pending operator', () => {
      mockUsePvpAuth.mockReturnValue({ state: 'pending' });

      render(<PvpTabsLayout />);

      expect(screen.queryByTestId('redirect')).toBeNull();
      expect(screen.getByTestId('tabs')).toBeTruthy();
    });
  });
});
