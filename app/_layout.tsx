import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Redirect, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import * as SplashScreen from 'expo-splash-screen';
import { AppProviders } from '@/src/providers/AppProviders';
import { useTheme } from '@/src/shared/theme/theme-context';
import { useOperationalPlatformAccess } from '@/src/shared/platform/useOperationalPlatformAccess';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: 'index',
};

function AppShell() {
  const { isDark } = useTheme();
  const pathname = usePathname();
  const platformAccess = useOperationalPlatformAccess();

  if (platformAccess === 'checking') {
    return null;
  }

  if (platformAccess === 'blocked' && pathname !== '/desktop-blocked') {
    return <Redirect href="/desktop-blocked" />;
  }

  if (platformAccess === 'allowed' && pathname === '/desktop-blocked') {
    return <Redirect href="/" />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(supplier-tabs)" />
        <Stack.Screen name="(pvp-tabs)" />
        <Stack.Screen name="batch" />
        <Stack.Screen name="desktop-blocked" />
        <Stack.Screen name="pvp" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  // On web, fonts are loaded via Google Fonts CSS in app/+html.tsx.
  // Passing an empty object makes useFonts resolve immediately with true.
  const [fontsLoaded] = useFonts(
    Platform.OS === 'web'
      ? {}
      : {
          SpaceGrotesk_400Regular,
          SpaceGrotesk_500Medium,
          SpaceGrotesk_600SemiBold,
          SpaceGrotesk_700Bold,
        }
  );

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}
