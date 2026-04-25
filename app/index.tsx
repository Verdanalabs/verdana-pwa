import { Redirect } from 'expo-router';
import { useAuth } from '@/src/features/auth/state/auth-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';

export default function IndexRoute() {
  const { isReady, isAuthenticated, needsOnboarding } = useAuth();
  const { state: pvpState } = usePvpAuth();

  // Wait for Privy to finish initializing before redirecting
  if (!isReady) return null;

  if (pvpState === 'active') {
    return <Redirect href="/(pvp-tabs)/dashboard" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (needsOnboarding) {
    return <Redirect href="/(auth)/onboarding-profile" />;
  }

  return <Redirect href="/(supplier-tabs)/home" />;
}
