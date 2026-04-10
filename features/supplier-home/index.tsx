import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_DASHBOARD, MOCK_BATCH_SUMMARIES, MOCK_SUPPLIER } from '@/mocks';
import { Font, FontSize } from '@/constants/typography';
import { useThemeColors } from '@/store/theme-context';
import { HeroCard } from './components/HeroCard';
import { DashboardMetrics } from './components/DashboardMetrics';
import { QuickActions } from './components/QuickActions';
import { LatestBatches } from './components/LatestBatches';

function dicebearUrl(name: string, bgColor?: string) {
  const seed = encodeURIComponent(name);
  const bg   = (bgColor ?? '#0d160d').replace('#', '');
  return `https://api.dicebear.com/9.x/avataaars/png?seed=${seed}&backgroundColor=${bg}&backgroundType=solid`;
}

export function SupplierHomeScreen() {
  const c = useThemeColors();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: c.background }]}>
        <View>
          <Text style={[styles.appName, { color: c.foreground }]}>
            {MOCK_SUPPLIER.name}
          </Text>
          <Text style={[styles.appTagline, { color: c.textFaint }]}>
            {MOCK_SUPPLIER.tier.charAt(0).toUpperCase() + MOCK_SUPPLIER.tier.slice(1)} · {MOCK_SUPPLIER.operationalArea}
          </Text>
        </View>
        <View style={styles.topBarRight}>
          {/* Notification */}
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}
          >
            <Ionicons name="notifications-outline" size={18} color={c.textSecondary} />
            <View style={[styles.notifDot, { backgroundColor: c.error, borderColor: c.background }]} />
          </TouchableOpacity>

          {/* Avatar */}
          <TouchableOpacity style={[styles.avatar, { borderColor: c.border }]}>
            <Image
              source={{ uri: dicebearUrl(MOCK_SUPPLIER.name, c.surface) }}
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
        <HeroCard data={MOCK_DASHBOARD} supplierName={MOCK_SUPPLIER.name} />
        <DashboardMetrics data={MOCK_DASHBOARD} />
        <QuickActions />
        <LatestBatches batches={MOCK_BATCH_SUMMARIES} />
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
