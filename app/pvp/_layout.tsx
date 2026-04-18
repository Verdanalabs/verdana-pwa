import { Redirect, Stack, usePathname } from 'expo-router';
import { usePvpAuth } from '@/store/pvp-auth-context';

export default function PvpLayout() {
  const { state } = usePvpAuth();
  const pathname = usePathname();

  if (state === 'idle') {
    return <Redirect href="/(auth)/pvp-login" />;
  }

  if (state === 'active' && pathname !== '/pvp/qr-scan') {
    return <Redirect href="/(pvp-tabs)/dashboard" />;
  }

  // Selalu render Stack yang sama — jangan ganti struktur navigator berdasarkan state
  // Navigasi per-state dihandle oleh masing-masing screen
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="pending-approval" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="qr-scan" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
