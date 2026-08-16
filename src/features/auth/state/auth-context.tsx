import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePrivy, useLogout } from "@privy-io/react-auth";
import { syncUser, type VerdanaUser } from "@/src/features/auth/services/auth-api";
import { ApiError } from "@/src/shared/services/api";
import { logoutOneSignalUser } from "@/src/features/notifications/services/onesignal-client";

interface OnboardingInput {
  name: string;
}

interface AuthContextValue {
  user: VerdanaUser | null;
  isReady: boolean;
  isAuthenticated: boolean;
  /**
   * Privy holds a session, whatever the Verdana account did.
   *
   * Distinct from `isAuthenticated`, which also requires the account sync to
   * have succeeded. The gap between the two is a real state: a signed-in
   * identity this app cannot use, which happens when the same identity is
   * registered against another role. A login screen that only knows
   * `isAuthenticated` offers a sign-in button there, and Privy rejects it
   * because a session already exists.
   */
  hasSession: boolean;
  /** Why the account sync failed for good. Null while it can still succeed. */
  authError: string | null;
  needsOnboarding: boolean;
  loginWithGoogle: () => void;
  loginWithEmail: () => void;
  loginWithSms: () => void;
  completeOnboarding: (input: OnboardingInput) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isReady: false,
  isAuthenticated: false,
  hasSession: false,
  authError: null,
  needsOnboarding: false,
  loginWithGoogle: () => {},
  loginWithEmail: () => {},
  loginWithSms: () => {},
  completeOnboarding: async () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, user: privyUser, login, getAccessToken } = usePrivy();
  const { logout } = useLogout();

  const [user, setUser] = useState<VerdanaUser | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Prevent double-syncing on re-renders
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!ready || !authenticated) {
      if (!authenticated) {
        setUser(null);
        setNeedsOnboarding(false);
        setAuthError(null);
        syncedRef.current = false;
      }
      return;
    }

    if (syncedRef.current) return;

    // Find the embedded Solana wallet from linked accounts
    const solanaWallet = privyUser?.linkedAccounts?.find(
      (a) =>
        a.type === "wallet" &&
        (a as { chainType?: string }).chainType === "solana" &&
        (a as { walletClientType?: string }).walletClientType === "privy",
    ) as { address: string } | undefined;

    // ponytail: Privy provisions the embedded wallet async. Bail until it's
    // ready — effect re-runs on privyUser change, so sync fires once it lands.
    // Without this, first-login sync sends no wallet_address → 400 for new users.
    if (!solanaWallet?.address) return;

    syncedRef.current = true;

    async function sync() {
      try {
        const token = await getAccessToken();
        if (!token) return;

        const verdanaUser = await syncUser(token, {
          role: "collector",
          wallet_address: solanaWallet?.address,
        });

        setUser(verdanaUser);
        setNeedsOnboarding(verdanaUser.is_new);
        setAuthError(null);
      } catch (err) {
        // A stale token is recoverable by signing out and back in.
        if (err instanceof ApiError && err.status === 401) {
          logout();
          return;
        }

        // Any other 4xx is the server refusing this identity, not a blip. The
        // common one is 409 ACCOUNT_ROLE_CONFLICT: the identity is registered
        // against the other role, so retrying cannot change the answer.
        // Leaving syncedRef set stops the loop; the message tells the operator
        // what happened instead of leaving the screen silently stuck.
        if (err instanceof ApiError && err.status && err.status >= 400 && err.status < 500) {
          setAuthError(err.message);
          return;
        }

        // 5xx or a network failure — genuinely worth another attempt.
        syncedRef.current = false;
      }
    }

    sync();
  }, [ready, authenticated, privyUser, getAccessToken, logout]);

  const completeOnboarding = useCallback(
    async (input: OnboardingInput) => {
      const token = await getAccessToken();
      if (!token) return;

      const updated = await syncUser(token, {
        role: 'collector',
        wallet_address: user?.wallet_address ?? undefined,
        display_name: input.name,
      });
      setUser(updated);
      setNeedsOnboarding(false);
    },
    [getAccessToken, user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady: ready,
      isAuthenticated: authenticated && user !== null,
      hasSession: authenticated,
      authError,
      needsOnboarding,
      // Privy throws if login() is called while a session exists, so these
      // no-op in that case. The caller should be showing the signed-in-but-
      // unusable state rather than a sign-in button; this keeps a stray tap
      // from surfacing an SDK error the operator cannot act on.
      loginWithGoogle: () => { if (!authenticated) login({ loginMethods: ["google"] }); },
      loginWithEmail: () => { if (!authenticated) login({ loginMethods: ["email"] }); },
      loginWithSms: () => { if (!authenticated) login({ loginMethods: ["sms"] }); },
      completeOnboarding,
      signOut: () => {
        setUser(null);
        setNeedsOnboarding(false);
        setAuthError(null);
        syncedRef.current = false;
        void logoutOneSignalUser();
        logout();
      },
    }),
    [user, ready, authenticated, authError, needsOnboarding, login, completeOnboarding, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
