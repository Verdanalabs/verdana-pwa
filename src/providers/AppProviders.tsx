import type { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { AuthProvider } from '@/src/features/auth/state/auth-context';
import { PvpAuthProvider } from '@/src/features/pvp/state/pvp-auth-context';
import { appVariant } from '@/src/shared/config/app-variant';
import { ThemeProvider } from '@/src/shared/theme/theme-context';

function CollectorProviders({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.EXPO_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ['google', 'email', 'sms'],
        embeddedWallets: {
          solana: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </PrivyProvider>
  );
}

function PvpProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <PvpAuthProvider>{children}</PvpAuthProvider>
    </ThemeProvider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return appVariant === 'collector'
    ? <CollectorProviders>{children}</CollectorProviders>
    : <PvpProviders>{children}</PvpProviders>;
}
