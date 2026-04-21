import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/src/features/auth/state/auth-context';

export default function AuthLayout() {
  const { isAuthenticated, needsOnboarding } = useAuth();

  // Authenticated and finished onboarding → go to app
  if (isAuthenticated && !needsOnboarding) {
    return <Redirect href="/(supplier-tabs)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
