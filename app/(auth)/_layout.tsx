import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/src/features/auth/state/auth-context';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect href="/(supplier-tabs)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
