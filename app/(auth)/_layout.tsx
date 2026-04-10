import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/store/auth-context';

export default function AuthLayout() {
  const { isAuthenticated, needsOnboarding } = useAuth();

  if (isAuthenticated && !needsOnboarding) {
    return <Redirect href="/(supplier-tabs)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
