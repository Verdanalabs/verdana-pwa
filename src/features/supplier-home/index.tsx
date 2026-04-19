import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useAuth } from '@/src/features/auth/state/auth-context';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { getMockBatchSummaries } from '@/src/shared/services/mock/batch-data';
import { getMockDashboardSummary, getMockSupplier } from '@/src/shared/services/mock/supplier-data';
import { HeroCard } from './components/HeroCard';
import { DashboardMetrics } from './components/DashboardMetrics';
import { QuickActions } from './components/QuickActions';
import { LatestBatches } from './components/LatestBatches';

function dicebearUrl(name: string, bgColor?: string) {
  const seed = encodeURIComponent(name);
  const bg = (bgColor ?? '#0d160d').replace('#', '');
  return `https://api.dicebear.com/9.x/avataaars/png?seed=${seed}&backgroundColor=${bg}&backgroundType=solid`;
}

export function SupplierHomeScreen() {
  const c = useThemeColors();
  const { supplier } = useAuth();
  const activeSupplier = supplier ?? getMockSupplier();
  const dashboard = getMockDashboardSummary();
  const latestBatches = getMockBatchSummaries();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.topBar, { backgroundColor: c.background }]}>
        <View>
          <Text style={[styles.appName, { color: c.foreground }]}>
            {activeSupplier.name}
          </Text>
          <Text style={[styles.appTagline, { color: c.textFaint }]}>
            {activeSupplier.tier.charAt(0).toUpperCase() + activeSupplier.tier.slice(1)} · {activeSupplier.operationalArea}
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
              source={{ uri: dicebearUrl(activeSupplier.name, c.surface) }}
              style={styles.avatarImg}
              contentFit="cover"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HeroCard data={dashboard} supplierName={activeSupplier.name} />
        <DashboardMetrics data={dashboard} />
        <QuickActions />
        <LatestBatches batches={latestBatches} />
      </ScrollView>
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
});
