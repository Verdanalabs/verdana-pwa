import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/src/features/auth/state/auth-context';
import { CustomTabBar } from '@/src/shared/navigation/SupplierTabBar';

export default function SupplierTabsLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="wallet" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
