import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/store/auth-context';

export default function AuthLayout() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect href="/(supplier-tabs)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
