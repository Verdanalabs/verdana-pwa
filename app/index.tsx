import { Redirect } from 'expo-router';
import {
  appVariant,
  getAuthenticatedHref,
  getGuestEntryHref,
} from '@/src/shared/config/app-variant';
import { useAuth } from '@/src/features/auth/state/auth-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';

function CollectorIndexRoute() {
  const { isReady, isAuthenticated, needsOnboarding } = useAuth();

  // Wait for Privy to finish initializing before redirecting
  if (!isReady) return null;

  if (!isAuthenticated) {
    return <Redirect href={getGuestEntryHref('collector')} />;
  }

  if (needsOnboarding) {
    return <Redirect href="/(auth)/onboarding-profile" />;
  }

  return <Redirect href={getAuthenticatedHref('collector')} />;
}

function PvpIndexRoute() {
  const { state } = usePvpAuth();

  if (state === 'active') {
    return <Redirect href={getAuthenticatedHref('pvp')} />;
  }

  if (state === 'authenticated') {
    return <Redirect href="/pvp/onboarding" />;
  }

  return <Redirect href={getGuestEntryHref('pvp')} />;
}

export default function IndexRoute() {
  return appVariant === 'collector' ? <CollectorIndexRoute /> : <PvpIndexRoute />;
}
