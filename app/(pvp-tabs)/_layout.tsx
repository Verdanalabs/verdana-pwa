import { Redirect, Tabs } from 'expo-router';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { PvpCustomTabBar } from '@/src/shared/navigation/PvpTabBar';

export default function PvpTabsLayout() {
  const { state } = usePvpAuth();

  if (state === 'idle') return <Redirect href="/(auth)/pvp-login" />;
  if (state === 'authenticated') return <Redirect href="/pvp/onboarding" />;

  return (
    <Tabs
      tabBar={(props) => <PvpCustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="log" />
      <Tabs.Screen name="pending" />
      <Tabs.Screen name="facility" />
    </Tabs>
  );
}
