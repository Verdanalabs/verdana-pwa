import { Redirect, Stack } from 'expo-router';
import { appVariant } from '@/src/shared/config/app-variant';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';

export default function MaggotLayout() {
  const { state } = usePvpAuth();

  if (appVariant !== 'pvp') {
    return <Redirect href="/" />;
  }
  if (state === 'idle') {
    return <Redirect href="/(auth)/pvp-login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
