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

interface OnboardingInput {
  name: string;
  operationalArea: string;
  primaryMaterial: string;
}

interface AuthContextValue {
  user: VerdanaUser | null;
  isReady: boolean;
  isAuthenticated: boolean;
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

  // Prevent double-syncing on re-renders
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!ready || !authenticated) {
      if (!authenticated) {
        setUser(null);
        setNeedsOnboarding(false);
        syncedRef.current = false;
      }
      return;
    }

    if (syncedRef.current) return;
    syncedRef.current = true;

    // Find the embedded Solana wallet from linked accounts
    const solanaWallet = privyUser?.linkedAccounts?.find(
      (a) =>
        a.type === "wallet" &&
        (a as { chainType?: string }).chainType === "solana" &&
        (a as { walletClientType?: string }).walletClientType === "privy",
    ) as { address: string } | undefined;

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
      } catch {
        // Network error or invalid token — allow retry on next render
        syncedRef.current = false;
      }
    }

    sync();
  }, [ready, authenticated, privyUser, getAccessToken]);

  const completeOnboarding = useCallback(
    async (input: OnboardingInput) => {
      const token = await getAccessToken();
      if (!token) return;

      const updated = await syncUser(token, { display_name: input.name });
      setUser(updated);
      setNeedsOnboarding(false);
    },
    [getAccessToken],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady: ready,
      isAuthenticated: authenticated && user !== null,
      needsOnboarding,
      loginWithGoogle: () => login({ loginMethods: ["google"] }),
      loginWithEmail: () => login({ loginMethods: ["email"] }),
      loginWithSms: () => login({ loginMethods: ["sms"] }),
      completeOnboarding,
      signOut: () => {
        setUser(null);
        setNeedsOnboarding(false);
        syncedRef.current = false;
        logout();
      },
    }),
    [user, ready, authenticated, needsOnboarding, login, completeOnboarding, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
