import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { getMockSupplier } from '@/src/shared/services/mock/supplier-data';
import { HeroCard } from './components/HeroCard';
import { DashboardMetrics } from './components/DashboardMetrics';
import { QuickActions } from './components/QuickActions';
import { LatestBatches } from './components/LatestBatches';
import { useSupplierHome } from './hooks/useSupplierHome';

function SkeletonBox({ width, height, radius = 10 }: { width: number | string; height: number; radius?: number }) {
  const c = useThemeColors();
  return (
    <View style={{ width: width as number, height, borderRadius: radius, backgroundColor: c.border }} />
  );
}

function HomeLoadingSkeleton() {
  const c = useThemeColors();
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Hero skeleton */}
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
      {/* Metrics skeleton */}
      <View style={[styles.skeletonMetrics, { backgroundColor: c.surface, borderColor: c.border }]}>
        <SkeletonBox width="45%" height={12} radius={6} />
        <SkeletonBox width="30%" height={38} radius={8} />
        <SkeletonBox width="100%" height={7} radius={99} />
        <View style={styles.skeletonFooter}>
          <SkeletonBox width="35%" height={10} radius={5} />
          <SkeletonBox width="15%" height={10} radius={5} />
        </View>
      </View>
      {/* Quick actions skeleton */}
      <View style={styles.skeletonActions}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonActionItem}>
            <View style={[styles.skeletonActionCircle, { backgroundColor: c.surface, borderColor: c.border }]} />
            <SkeletonBox width={40} height={9} radius={5} />
          </View>
        ))}
      </View>
      {/* Batches skeleton */}
      <LatestBatches batches={[]} isLoading />
    </ScrollView>
  );
}

function dicebearUrl(name: string, bgColor?: string) {
  const seed = encodeURIComponent(name);
  const bg = (bgColor ?? '#0d160d').replace('#', '');
  return `https://api.dicebear.com/9.x/avataaars/png?seed=${seed}&backgroundColor=${bg}&backgroundType=solid`;
}

export function SupplierHomeScreen() {
  const c = useThemeColors();
  const { isLoading, user, batches, dashboard } = useSupplierHome();
  const mockSupplier = getMockSupplier();

  const displayName = user?.display_name ?? mockSupplier.name;
  const activeDashboard = dashboard ?? {
    totalKg: 0,
    batchCount: 0,
    cnftCount: 0,
    pendingTransitCount: 0,
    reputationScore: mockSupplier.reputationScore,
    usdcBalance: 0,
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.topBar, { backgroundColor: c.background }]}>
        <View>
          <Text style={[styles.appName, { color: c.foreground }]}>
            {displayName}
          </Text>
          <Text style={[styles.appTagline, { color: c.textFaint }]}>
            {mockSupplier.tier.charAt(0).toUpperCase() + mockSupplier.tier.slice(1)} · {mockSupplier.operationalArea}
          </Text>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}
          >
            <Ionicons name="notifications-outline" size={18} color={c.textSecondary} />
            <View style={[styles.notifDot, { backgroundColor: c.error, borderColor: c.background }]} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.avatar, { borderColor: c.border }]}>
            <Image
              source={{ uri: dicebearUrl(displayName, c.surface) }}
              style={styles.avatarImg}
              contentFit="cover"
            />
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
        >
          <HeroCard data={activeDashboard} supplierName={displayName} />
          <DashboardMetrics data={activeDashboard} tier={mockSupplier.tier} />
          <QuickActions />
          <LatestBatches batches={batches} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  appName: {
    fontSize: FontSize.xl,
    fontFamily: Font.bold,
  },
  appTagline: {
    fontSize: FontSize.xs,
    fontFamily: Font.regular,
    marginTop: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 99,
    borderWidth: 1.5,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 11,
    overflow: 'hidden',
    borderWidth: 1,
  },
  avatarImg: {
    width: 38,
    height: 38,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 22,
    paddingBottom: 40,
  },
  skeletonHero: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    gap: 14,
  },
  skeletonDivider: {
    height: 1,
    marginVertical: 2,
  },
  skeletonSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonMetrics: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skeletonActionItem: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  skeletonActionCircle: {
    width: 56,
    height: 56,
    borderRadius: 99,
    borderWidth: 1,
  },
});
