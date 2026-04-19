import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { createMockPvpOperator } from '@/src/shared/services/mock/pvp-data';
import type { PvpOperatorProfile } from '@/types';

export type PvpAuthState = 'idle' | 'pending' | 'approved' | 'active';

interface OnboardingInput {
  name: string;
  stationName: string;
  lat: number;
  lng: number;
}

interface PvpAuthContextValue {
  state: PvpAuthState;
  walletAddress: string | null;
  operator: PvpOperatorProfile | null;
  connectWallet: () => void;
  simulateApprove: () => void;
  simulateReject: () => void;
  completeOnboarding: (input: OnboardingInput) => void;
  signOut: () => void;
}

const PvpAuthContext = createContext<PvpAuthContextValue>({
  state: 'idle',
  walletAddress: null,
  operator: null,
  connectWallet: () => {},
  simulateApprove: () => {},
  simulateReject: () => {},
  completeOnboarding: () => {},
  signOut: () => {},
});

export function PvpAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PvpAuthState>('idle');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [operator, setOperator] = useState<PvpOperatorProfile | null>(null);

  const value = useMemo<PvpAuthContextValue>(() => ({
    state,
    walletAddress,
    operator,
    connectWallet: () => {
      setWalletAddress('7xKf2mk9...4nR8mQ');
      setState('pending');
    },
    simulateApprove: () => {
      setState('approved');
    },
    simulateReject: () => {
      setState('idle');
      setWalletAddress(null);
    },
    completeOnboarding: (input) => {
      setOperator(createMockPvpOperator({
        name: input.name,
        stationId: `PVP-${Date.now()}`,
        stationName: input.stationName,
        lat: input.lat,
        lng: input.lng,
      }));
      setState('active');
    },
    signOut: () => {
      setState('idle');
      setWalletAddress(null);
      setOperator(null);
    },
  }), [state, walletAddress, operator]);

  return <PvpAuthContext.Provider value={value}>{children}</PvpAuthContext.Provider>;
}

export function usePvpAuth() {
  return useContext(PvpAuthContext);
}
