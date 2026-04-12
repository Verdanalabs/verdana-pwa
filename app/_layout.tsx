import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/store/auth-context';
import { BatchDraftProvider } from '@/store/batch-draft-context';
import { ThemeProvider, useTheme } from '@/store/theme-context';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: 'index',
};

function AppShell() {
  const { isDark } = useTheme();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(supplier-tabs)" />
        <Stack.Screen name="batch" />
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
    <ThemeProvider>
      <AuthProvider>
        <BatchDraftProvider>
          <AppShell />
        </BatchDraftProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
