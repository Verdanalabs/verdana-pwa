import { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MaterialBadge } from '@/src/shared/ui/MaterialBadge';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useAuth } from '@/src/features/auth/state/auth-context';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { getMockWalletSummary } from '@/src/shared/services/mock/wallet-data';
import type { CNFTStatus } from '@/types';

type AssetFilter = 'all' | CNFTStatus;

const FILTERS: AssetFilter[] = ['all', 'verified', 'listed', 'collateral'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function assetFilterLabel(value: AssetFilter) {
  switch (value) {
    case 'verified':
      return 'Verified';
    case 'listed':
      return 'For Sale';
    case 'collateral':
      return 'Locked';
    default:
      return 'All';
  }
}

function AssetFilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();

  return (
    <TouchableOpacity
      style={[
        styles.filterChip,
        {
          backgroundColor: selected ? c.accent : c.surface,
          borderColor: selected ? c.accent : c.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.filterChipText,
          { color: selected ? c.accentContrast : c.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function AssetStatusPill({ status }: { status: CNFTStatus }) {
  const c = useThemeColors();

  const map: Record<CNFTStatus, { label: string; bg: string; fg: string }> = {
    verified: { label: 'Verified', bg: c.statusBg.verified, fg: c.statusFg.verified },
    listed: { label: 'For Sale', bg: c.statusBg.listed, fg: c.statusFg.listed },
    collateral: { label: 'Locked', bg: c.statusBg.collateral, fg: c.statusFg.collateral },
    burned: { label: 'Burned', bg: c.statusBg.rejected, fg: c.statusFg.rejected },
  };

  return (
    <View style={[styles.assetStatus, { backgroundColor: map[status].bg }]}>
      <Text style={[styles.assetStatusText, { color: map[status].fg }]}>{map[status].label}</Text>
    </View>
  );
}

export default function WalletRoute() {
  const c = useThemeColors();
  const { supplier } = useAuth();
  const [filter, setFilter] = useState<AssetFilter>('all');
  const wallet = getMockWalletSummary();

  const filteredAssets = useMemo(() => (
    wallet.cnfts.filter((asset) => filter === 'all' || asset.status === filter)
  ), [filter, wallet.cnfts]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: c.foreground }]}>Wallet</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              Keep your balance, asset count, and latest verified batches in one place.
            </Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="wallet-outline" size={18} color={c.accent} />
          </View>
        </View>

        <View style={[styles.heroCard, { borderColor: c.border }]}>
          <View style={[styles.heroGlow, { backgroundColor: c.heroGlowColor }]} />
          <Text style={styles.heroLabel}>Account Name</Text>
          <Text style={styles.heroAddress}>{supplier?.name ?? 'Your supplier account'}</Text>
          <Text style={styles.heroHint}>
            Track your supplier account points and asset count in one place.
          </Text>

          <View style={styles.heroStats}>
            <View style={[styles.heroStatCard, { borderColor: 'rgba(255,255,255,0.08)' }]}>
              <Text style={styles.heroStatValue}>{wallet.points.toLocaleString('en-US')}</Text>
              <Text style={styles.heroStatLabel}>Points</Text>
            </View>
            <View style={[styles.heroStatCard, { borderColor: 'rgba(255,255,255,0.08)' }]}>
              <Text style={styles.heroStatValue}>{wallet.cnftCount}</Text>
              <Text style={styles.heroStatLabel}>Assets</Text>
            </View>
          </View>
        </View>

        <View style={[styles.addressCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.addressRow}>
            <Text style={[styles.addressLabel, { color: c.textMuted }]}>Account Name</Text>
            <Ionicons name="person-outline" size={16} color={c.textFaint} />
          </View>
          <Text style={[styles.addressValue, { color: c.foreground }]}>{supplier?.name ?? 'Your supplier account'}</Text>
        </View>

        <View style={styles.filterSection}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Assets</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map((item) => (
              <AssetFilterChip
                key={item}
                label={assetFilterLabel(item)}
                selected={filter === item}
                onPress={() => setFilter(item)}
              />
            ))}
          </ScrollView>
        </View>

        {filteredAssets.length > 0 ? (
          <View style={styles.assetList}>
            {filteredAssets.map((asset) => (
              <TouchableOpacity
                key={asset.id}
                style={[styles.assetCard, { backgroundColor: c.surface, borderColor: c.border }]}
                onPress={() => router.push(`/wallet/cnft/${asset.id}` as never)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: asset.imageUrl }}
                  style={styles.assetImage}
                  contentFit="cover"
                />

                <View style={styles.assetBody}>
                  <View style={styles.assetTop}>
                    <View style={styles.assetTopLeft}>
                      <Text style={[styles.assetTitle, { color: c.foreground }]}>{asset.id}</Text>
                      <MaterialBadge material={asset.materialType} />
                    </View>
                    <AssetStatusPill status={asset.status} />
                  </View>

                  <View style={styles.assetMetrics}>
                    <View style={styles.assetMetricItem}>
                      <Text style={[styles.assetMetricLabel, { color: c.textMuted }]}>Batch</Text>
                      <Text style={[styles.assetMetricValue, { color: c.foreground }]}>{asset.batchId}</Text>
                    </View>
                    <View style={styles.assetMetricItem}>
                      <Text style={[styles.assetMetricLabel, { color: c.textMuted }]}>Weight</Text>
                      <Text style={[styles.assetMetricValue, { color: c.foreground }]}>{asset.weightKg} kg</Text>
                    </View>
                    <View style={styles.assetMetricItem}>
                      <Text style={[styles.assetMetricLabel, { color: c.textMuted }]}>Grade</Text>
                      <Text style={[styles.assetMetricValue, { color: c.foreground }]}>{asset.grade}</Text>
                    </View>
                  </View>

                  <View style={styles.assetBottom}>
                    <Text style={[styles.assetBottomText, { color: c.textMuted }]}>
                      Minted {formatDate(asset.mintedAt)}
                    </Text>
                    <Text style={[styles.assetBottomText, { color: c.textMuted }]}>
                      {shortAddress(asset.mintAddress)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="wallet-outline" size={20} color={c.accent} />
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>No assets in this filter yet.</Text>
            <Text style={[styles.emptyText, { color: c.textMuted }]}>
              Try another filter to see verified, listed, or locked assets.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontFamily: Font.bold,
    lineHeight: 28,
  },
  subtitle: {
    marginTop: 6,
    fontSize: FontSize.md,
    fontFamily: Font.regular,
    lineHeight: 22,
    maxWidth: 280,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 18,
    gap: 10,
    backgroundColor: '#0b160d',
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    top: -120,
    right: -90,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
  },
  heroAddress: {
    color: '#ffffff',
    fontSize: FontSize['2xl'],
    fontFamily: Font.bold,
    lineHeight: 28,
  },
  heroHint: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 20,
    maxWidth: 290,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  heroStatCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 4,
  },
  heroStatValue: {
    color: '#ffffff',
    fontSize: FontSize.xl,
    fontFamily: Font.bold,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
  },
  addressCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
  },
  addressValue: {
    fontSize: FontSize.md,
    fontFamily: Font.medium,
    lineHeight: 22,
  },
  filterSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: Font.bold,
  },
  filterRow: {
    gap: 10,
    paddingRight: 12,
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipText: {
    fontSize: FontSize.sm,
    fontFamily: Font.semiBold,
  },
  assetList: {
    gap: 12,
  },
  assetCard: {
    borderWidth: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  assetImage: {
    width: '100%',
    height: 170,
  },
  assetBody: {
    padding: 14,
    gap: 12,
  },
  assetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  assetTopLeft: {
    flex: 1,
    gap: 6,
  },
  assetTitle: {
    fontSize: FontSize.lg,
    fontFamily: Font.bold,
  },
  assetStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  assetStatusText: {
    fontSize: FontSize.xs,
    fontFamily: Font.semiBold,
  },
  assetMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  assetMetricItem: {
    flex: 1,
    gap: 4,
  },
  assetMetricLabel: {
    fontSize: FontSize.xs,
    fontFamily: Font.regular,
  },
  assetMetricValue: {
    fontSize: FontSize.md,
    fontFamily: Font.semiBold,
    lineHeight: 20,
  },
  assetBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  assetBottomText: {
    fontSize: FontSize.xs,
    fontFamily: Font.regular,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    alignItems: 'flex-start',
    gap: 10,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontFamily: Font.semiBold,
  },
  emptyText: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 20,
    maxWidth: 280,
  },
});
