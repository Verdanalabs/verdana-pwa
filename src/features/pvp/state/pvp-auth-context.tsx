import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLogout, usePrivy } from '@privy-io/react-auth';
import { ApiError } from '@/src/shared/services/api';
import { logoutOneSignalUser } from '@/src/features/notifications/services/onesignal-client';
import {
  getProcessorInvite,
  processorSync,
  type ProcessorInvite,
  type PvpActiveSite,
  type PvpLoginResponse,
} from '@/src/features/pvp/services/pvp-auth-api';

export type PvpAuthState = 'idle' | 'authenticated' | 'pending' | 'approved' | 'rejected' | 'active';

interface OnboardingInput {
  name?: string;
  fullName?: string;
  stationName?: string;
  facilityName?: string;
  phone?: string;
  lat?: number;
  lng?: number;
}

interface PvpAuthContextValue {
  state: PvpAuthState;
  isReady: boolean;
  token: string | null;
  walletAddress: string | null;
  invite: ProcessorInvite | null;
  inviteError: string | null;
  inviteToken: string | null;
  operator: PvpLoginResponse | null;
  activeSite: PvpActiveSite | null;
  setInviteToken: (token: string | null) => void;
  loginWithGoogle: () => void;
  loginWithEmail: () => void;
  connectWallet: () => void;
  simulateApprove: () => void;
  completeOnboarding: (input: OnboardingInput) => Promise<void>;
  refreshSession: () => Promise<void>;
  signOut: () => void;
}

const PvpAuthContext = createContext<PvpAuthContextValue>({
  state: 'idle',
  isReady: false,
  token: null,
  walletAddress: null,
  invite: null,
  inviteError: null,
  inviteToken: null,
  operator: null,
  activeSite: null,
  setInviteToken: () => {},
  loginWithGoogle: () => {},
  loginWithEmail: () => {},
  connectWallet: () => {},
  simulateApprove: () => {},
  completeOnboarding: async () => {},
  refreshSession: async () => {},
  signOut: () => {},
});

function getSolanaWalletAddress(privyUser: ReturnType<typeof usePrivy>['user']) {
  const wallet = privyUser?.linkedAccounts?.find(
    (account) =>
      account.type === 'wallet' &&
      (account as { chainType?: string }).chainType === 'solana' &&
      (account as { walletClientType?: string }).walletClientType === 'privy',
  ) as { address: string } | undefined;

  return wallet?.address;
}

function stateFromUser(user: PvpLoginResponse): PvpAuthState {
  if (user.approval_status === 'active' && user.active_site) return 'active';
  if (user.approval_status === 'rejected') return 'rejected';
  return 'pending';
}

export function PvpAuthProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, user: privyUser, login, getAccessToken } = usePrivy();
  const { logout } = useLogout();

  const [state, setState] = useState<PvpAuthState>('idle');
  const [token, setToken] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [invite, setInvite] = useState<ProcessorInvite | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [operator, setOperator] = useState<PvpLoginResponse | null>(null);
  const [activeSite, setActiveSite] = useState<PvpActiveSite | null>(null);
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!inviteToken) {
      setInvite(null);
      setInviteError(null);
      return;
    }

    let cancelled = false;
    const currentInviteToken = inviteToken;
    async function loadInvite() {
      try {
        const data = await getProcessorInvite(currentInviteToken);
        if (cancelled) return;
        setInvite(data);
        setInviteError(data.is_usable ? null : 'Invite link is expired or already used.');
      } catch (err) {
        if (cancelled) return;
        setInvite(null);
        setInviteError(err instanceof Error ? err.message : 'Invite link is invalid.');
      }
    }
    void loadInvite();
    return () => { cancelled = true; };
  }, [inviteToken]);

  const refreshSession = useCallback(async () => {
    if (!authenticated) {
      setOperator(null);
      setActiveSite(null);
      setToken(null);
      setWalletAddress(null);
      setState('idle');
      syncedRef.current = false;
      return;
    }

    const accessToken = await getAccessToken();
    if (!accessToken) return;
    setToken(accessToken);
    setWalletAddress(getSolanaWalletAddress(privyUser) ?? null);

    try {
      const user = await processorSync(accessToken, {});
      setOperator(user);
      setActiveSite(user.active_site ?? null);
      setState(stateFromUser(user));
      syncedRef.current = true;
    } catch (err) {
      if (err instanceof ApiError && err.code === 'MISSING_FIELDS') {
        setState('authenticated');
        syncedRef.current = true;
        return;
      }
      if (err instanceof ApiError && err.status === 401) {
        logout();
      }
      syncedRef.current = false;
    }
  }, [authenticated, getAccessToken, logout, privyUser]);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      setOperator(null);
      setActiveSite(null);
      setToken(null);
      setWalletAddress(null);
      setState('idle');
      syncedRef.current = false;
      return;
    }
    if (syncedRef.current) return;
    void refreshSession();
  }, [ready, authenticated, refreshSession]);

  const value = useMemo<PvpAuthContextValue>(() => ({
    state,
    isReady: ready,
    token,
    walletAddress,
    invite,
    inviteError,
    inviteToken,
    operator,
    activeSite,
    setInviteToken,
    loginWithGoogle: () => login({ loginMethods: ['google'] }),
    loginWithEmail: () => login({ loginMethods: ['email'] }),
    connectWallet: () => {
      setWalletAddress('7xKf2mk9...4nR8mQ');
      setState('pending');
    },
    simulateApprove: () => setState('approved'),
    completeOnboarding: async (input) => {
      if (!inviteToken) throw new Error('Invite token is required');
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('Not authenticated');
      setToken(accessToken);
      const walletAddress = getSolanaWalletAddress(privyUser);
      if (!walletAddress) throw new Error('Privy wallet is not ready. Please try again.');
      const user = await processorSync(accessToken, {
        invite_token: inviteToken,
        display_name: input.fullName ?? input.name ?? '',
        facility_name: input.facilityName ?? input.stationName ?? '',
        phone: input.phone ?? '',
        wallet_address: walletAddress,
      });
      setOperator(user);
      setActiveSite(user.active_site ?? null);
      setWalletAddress(walletAddress);
      setState(stateFromUser(user));
    },
    refreshSession,
    signOut: () => {
      setOperator(null);
      setActiveSite(null);
      setToken(null);
      setWalletAddress(null);
      setState('idle');
      syncedRef.current = false;
      void logoutOneSignalUser();
      logout();
    },
  }), [state, ready, token, walletAddress, invite, inviteError, inviteToken, operator, activeSite, login, getAccessToken, privyUser, refreshSession, logout]);

  return <PvpAuthContext.Provider value={value}>{children}</PvpAuthContext.Provider>;
}

export function usePvpAuth() {
  return useContext(PvpAuthContext);
}
