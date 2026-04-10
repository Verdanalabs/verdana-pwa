import { Redirect } from 'expo-router';
import { useAuth } from '@/store/auth-context';

export default function IndexRoute() {
  const { isAuthenticated, needsOnboarding } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (needsOnboarding) {
    return <Redirect href="/(auth)/onboarding-profile" />;
  }

  return <Redirect href="/(supplier-tabs)/home" />;
}
