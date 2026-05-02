import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { PushPermissionBanner } from '@/src/features/notifications/components/PushPermissionBanner';
import { usePushNotifications } from '@/src/features/notifications/hooks/usePushNotifications';
import { HeroCard } from './components/HeroCard';
import { QuickActions } from './components/QuickActions';
import { LatestBatches } from './components/LatestBatches';
import { DashboardMetrics } from './components/DashboardMetrics';
import { useSupplierHome } from './hooks/useSupplierHome';

function HomeLoadingSkeleton() {
  const c = useThemeColors();
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.skeletonHero, { backgroundColor: c.surface, borderColor: c.border }]}>
        <SkeletonBox width="50%" height={14} radius={7} />
        <SkeletonBox width="35%" height={10} radius={6} />
        <SkeletonBox width="55%" height={38} radius={8} />
        <View style={[styles.skeletonDivider, { backgroundColor: c.border }]} />
        <View style={styles.skeletonSubRow}>
          <SkeletonBox width="25%" height={32} radius={7} />
          <SkeletonBox width="25%" height={32} radius={7} />
          <SkeletonBox width="25%" height={32} radius={7} />
        </View>
      </View>
      <View style={styles.skeletonActions}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonActionItem}>
            <View style={[styles.skeletonActionCircle, { backgroundColor: c.surface, borderColor: c.border }]} />
            <SkeletonBox width={40} height={9} radius={5} />
          </View>
        ))}
      </View>
      <LatestBatches batches={[]} isLoading />
    </ScrollView>
  );
}

function dicebearUrl(name: string) {
  return `https://api.dicebear.com/9.x/avataaars-neutral/png?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export function SupplierHomeScreen() {
  const c = useThemeColors();
  const { getAccessToken } = usePrivy();
  const { isLoading, isRefreshing, user, batches, dashboard, refresh } = useSupplierHome();
  const push = usePushNotifications({
    userId: user?.id,
    role: 'collector',
    email: user?.email,
    getAccessToken,
  });

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));

  const displayName = user?.display_name ?? 'Supplier';
  const activeDashboard = dashboard ?? {
    totalKg: 0,
    batchCount: 0,
    cnftCount: 0,
    pendingTransitCount: 0,
    reputationScore: null,
    reputationTier: null,
    reputationState: 'unavailable' as const,
    usdcBalance: 0,
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.topBar, { backgroundColor: c.background }]}>
        <View>
          <Text style={[styles.appName, { color: c.foreground }]}>{displayName}</Text>
          <Text style={[styles.appTagline, { color: c.textFaint }]}>Waste Collector</Text>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}
            onPress={() => { void push.requestPermission(); }}
          >
            <Ionicons name="notifications-outline" size={18} color={c.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.avatar, { borderColor: c.border }]}>
            <Image source={{ uri: dicebearUrl(displayName) }} style={styles.avatarImg} contentFit="cover" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <HomeLoadingSkeleton />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={(
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => { void refresh(); }}
              tintColor={c.accent}
              colors={[c.accent]}
            />
          )}
        >
          <PushPermissionBanner
            status={push.status}
            error={push.error}
            title="Get batch updates"
            body="Receive alerts when PVP receives your batch, requests your signature, or finishes verification."
            onEnable={() => { void push.requestPermission(); }}
          />
          <HeroCard data={activeDashboard} supplierName={displayName} />
          <DashboardMetrics data={activeDashboard} />
          <QuickActions />
          <LatestBatches batches={batches} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  appName: { fontSize: FontSize.xl, fontFamily: Font.bold },
  appTagline: { fontSize: FontSize.xs, fontFamily: Font.regular, marginTop: 1 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 38, height: 38, borderRadius: 11, overflow: 'hidden', borderWidth: 1 },
  avatarImg: { width: 38, height: 38 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 22, paddingBottom: 40 },
  skeletonHero: { borderRadius: 20, borderWidth: 1, padding: 22, gap: 14 },
  skeletonDivider: { height: 1, marginVertical: 2 },
  skeletonSubRow: { flexDirection: 'row', justifyContent: 'space-between' },
  skeletonActions: { flexDirection: 'row', justifyContent: 'space-between' },
  skeletonActionItem: { alignItems: 'center', gap: 8, flex: 1 },
  skeletonActionCircle: { width: 56, height: 56, borderRadius: 99, borderWidth: 1 },
});
