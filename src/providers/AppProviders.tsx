import type { ReactNode } from 'react';
import { AuthProvider } from '@/src/features/auth/state/auth-context';
import { PvpAuthProvider } from '@/src/features/pvp/state/pvp-auth-context';
import { ThemeProvider } from '@/src/shared/theme/theme-context';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PvpAuthProvider>{children}</PvpAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
