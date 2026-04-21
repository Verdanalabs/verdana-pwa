import type { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { AuthProvider } from '@/src/features/auth/state/auth-context';
import { PvpAuthProvider } from '@/src/features/pvp/state/pvp-auth-context';
import { ThemeProvider } from '@/src/shared/theme/theme-context';

export function AppProviders({ children }: { children: ReactNode }) {
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
        <AuthProvider>
          <PvpAuthProvider>{children}</PvpAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </PrivyProvider>
  );
}
