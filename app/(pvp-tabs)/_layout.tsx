import { Redirect, Tabs } from 'expo-router';
import { PvpCustomTabBar } from '@/components/pvp/PvpCustomTabBar';
import { usePvpAuth } from '@/store/pvp-auth-context';

export default function PvpTabsLayout() {
  const { state } = usePvpAuth();

  if (state === 'idle') return <Redirect href="/(auth)/pvp-login" />;
  if (state === 'pending') return <Redirect href="/pvp/pending-approval" />;
  if (state === 'approved') return <Redirect href="/pvp/onboarding" />;

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
