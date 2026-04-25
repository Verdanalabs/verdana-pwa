import { Redirect, Stack, usePathname } from 'expo-router';
import { appVariant } from '@/src/shared/config/app-variant';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';

export default function PvpLayout() {
  const { state } = usePvpAuth();
  const pathname = usePathname();

  if (appVariant !== 'pvp') {
    return <Redirect href="/" />;
  }

  if (state === 'idle') {
    return <Redirect href="/(auth)/pvp-login" />;
  }

  if (state === 'active' && pathname !== '/pvp/qr-scan' && pathname !== '/pvp/cosign') {
    return <Redirect href="/(pvp-tabs)/dashboard" />;
  }

  // Selalu render Stack yang sama — jangan ganti struktur navigator berdasarkan state
  // Navigasi per-state dihandle oleh masing-masing screen
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="pending-approval" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="qr-scan" options={{ presentation: 'modal' }} />
      <Stack.Screen name="cosign" />
    </Stack>
  );
}
