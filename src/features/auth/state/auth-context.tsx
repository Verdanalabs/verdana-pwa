import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { createMockSupplierProfile, getMockSupplier } from '@/src/shared/services/mock/supplier-data';
import type { SupplierProfile } from '@/types';

type AuthProviderType = 'google' | 'whatsapp' | 'email';

interface OnboardingInput {
  name: string;
  operationalArea: string;
  primaryMaterial: string;
}

interface AuthContextValue {
  supplier: SupplierProfile | null;
  provider: AuthProviderType | null;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  login: (provider: AuthProviderType) => void;
  completeOnboarding: (input: OnboardingInput) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  supplier: null,
  provider: null,
  isAuthenticated: false,
  needsOnboarding: false,
  login: () => {},
  completeOnboarding: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<AuthProviderType | null>(null);
  const [supplier, setSupplier] = useState<SupplierProfile | null>(null);

  const value = useMemo<AuthContextValue>(() => ({
    supplier,
    provider,
    isAuthenticated: provider !== null,
    needsOnboarding: false,
    login: (nextProvider) => {
      setProvider(nextProvider);
      setSupplier(getMockSupplier());
    },
    completeOnboarding: (input) => {
      setSupplier(createMockSupplierProfile({
        name: input.name,
        operationalArea: input.operationalArea,
        primaryMaterial: input.primaryMaterial,
      }));
    },
    signOut: () => {
      setProvider(null);
      setSupplier(null);
    },
  }), [provider, supplier]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
