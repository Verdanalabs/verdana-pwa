import { Redirect } from 'expo-router';
import { useAuth } from '@/store/auth-context';
import { usePvpAuth } from '@/store/pvp-auth-context';

export default function IndexRoute() {
  const { isAuthenticated, needsOnboarding } = useAuth();
  const { state: pvpState } = usePvpAuth();

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
