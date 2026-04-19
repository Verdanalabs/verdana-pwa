import { Redirect } from 'expo-router';
import { useAuth } from '@/src/features/auth/state/auth-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';

export default function IndexRoute() {
  const { isAuthenticated } = useAuth();
  const { state: pvpState } = usePvpAuth();

  if (pvpState === 'active') {
    return <Redirect href="/(pvp-tabs)/dashboard" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return <Redirect href="/(supplier-tabs)/home" />;
}
