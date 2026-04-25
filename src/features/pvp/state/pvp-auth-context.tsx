import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { pvpLogin, type PvpLoginResponse } from '@/src/features/pvp/services/pvp-auth-api';
import { createPvpSite, type PvpSite } from '@/src/features/pvp/services/pvp-api';

export type PvpAuthState = 'idle' | 'authenticated' | 'active';

interface OnboardingInput {
  stationName: string;
  lat: number;
  lng: number;
}

interface PvpAuthContextValue {
  state: PvpAuthState;
  token: string | null;
  operator: PvpLoginResponse | null;
  activeSite: PvpSite | null;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  completeOnboarding: (input: OnboardingInput) => Promise<void>;
  signOut: () => void;
}

const PvpAuthContext = createContext<PvpAuthContextValue>({
  state: 'idle',
  token: null,
  operator: null,
  activeSite: null,
  loginWithCredentials: async () => {},
  completeOnboarding: async () => {},
  signOut: () => {},
});

export function PvpAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PvpAuthState>('idle');
  const [token, setToken] = useState<string | null>(null);
  const [operator, setOperator] = useState<PvpLoginResponse | null>(null);
  const [activeSite, setActiveSite] = useState<PvpSite | null>(null);

  const value = useMemo<PvpAuthContextValue>(() => ({
    state,
    token,
    operator,
    activeSite,
    loginWithCredentials: async (email, password) => {
      const res = await pvpLogin(email, password);
      setToken(res.token);
      setOperator(res);
      if (res.active_site) {
        // Operator already completed onboarding — restore active site and skip setup
        setActiveSite({
          id: res.active_site.id,
          name: res.active_site.name,
          latitude: res.active_site.latitude,
          longitude: res.active_site.longitude,
          radius_meters: res.active_site.radius_meters,
          is_active: true,
          created_at: '',
        });
        setState('active');
      } else {
        setState('authenticated');
      }
    },
    completeOnboarding: async (input) => {
      if (!token) throw new Error('Not authenticated');
      const site = await createPvpSite({
        name: input.stationName,
        latitude: input.lat,
        longitude: input.lng,
      }, token);
      setActiveSite(site);
      setState('active');
    },
    signOut: () => {
      setState('idle');
      setToken(null);
      setOperator(null);
      setActiveSite(null);
    },
  }), [state, token, operator, activeSite]);

  return <PvpAuthContext.Provider value={value}>{children}</PvpAuthContext.Provider>;
}

export function usePvpAuth() {
  return useContext(PvpAuthContext);
}
