import { Redirect, Stack } from 'expo-router';
import {
  appVariant,
  getAuthenticatedHref,
} from '@/src/shared/config/app-variant';
import { useAuth } from '@/src/features/auth/state/auth-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';

function CollectorAuthLayout() {
  const { isAuthenticated, needsOnboarding } = useAuth();

  // Authenticated and finished onboarding → go to app
  if (isAuthenticated && !needsOnboarding) {
    return <Redirect href="/(supplier-tabs)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

function PvpAuthLayout() {
  const { state } = usePvpAuth();

  if (state === 'active') {
    return <Redirect href={getAuthenticatedHref('pvp')} />;
  }

  if (state === 'authenticated') {
    return <Redirect href="/pvp/onboarding" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function AuthLayout() {
  return appVariant === 'collector' ? <CollectorAuthLayout /> : <PvpAuthLayout />;
}
