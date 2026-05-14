import React from 'react';
import { render, screen } from '@testing-library/react-native';
import IndexRoute from '@/app/index';
import AuthLayout from '@/app/(auth)/_layout';
import PvpTabsLayout from '@/app/(pvp-tabs)/_layout';
import { useAuth } from '@/src/features/auth/state/auth-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';

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

describe('route guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects active PVP sessions to the PVP dashboard from root', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    mockUsePvpAuth.mockReturnValue({ state: 'active' });

    render(<IndexRoute />);

    expect(screen.getByTestId('redirect').props.children).toBe('/(pvp-tabs)/dashboard');
  });

  it('redirects unauthenticated supplier sessions to welcome from root', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    mockUsePvpAuth.mockReturnValue({ state: 'idle' });

    render(<IndexRoute />);

    expect(screen.getByTestId('redirect').props.children).toBe('/(auth)/welcome');
  });

  it('redirects authenticated suppliers away from auth routes', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });

    render(<AuthLayout />);

    expect(screen.getByTestId('redirect').props.children).toBe('/(supplier-tabs)/home');
  });

  it('redirects pending PVP sessions into the approval flow', () => {
    mockUsePvpAuth.mockReturnValue({ state: 'pending' });

    render(<PvpTabsLayout />);

    expect(screen.getByTestId('redirect').props.children).toBe('/pvp/pending-approval');
  });

  it('renders PVP tabs for active PVP sessions', () => {
    mockUsePvpAuth.mockReturnValue({ state: 'active' });

    render(<PvpTabsLayout />);

    expect(screen.getByTestId('tabs')).toBeTruthy();
  });
});
