import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MaterialBadge } from '@/src/shared/ui/MaterialBadge';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { useWallet } from '@/src/features/wallet/hooks/useWallet';
import type { CNFTStatus } from '@/types';

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

function AssetStatusPill({ status }: { status: CNFTStatus }) {
  const c = useThemeColors();

  const map: Record<CNFTStatus, { label: string; bg: string; fg: string }> = {
    minted: { label: 'Asset Ready', bg: c.statusBg.minted, fg: c.statusFg.minted },
  };

  return (
    <View style={[styles.assetStatus, { backgroundColor: map[status].bg }]}>
      <Text style={[styles.assetStatusText, { color: map[status].fg }]}>{map[status].label}</Text>
    </View>
  );
}

function WalletLoadingSkeleton() {
  const c = useThemeColors();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.skeletonHeaderCopy}>
          <SkeletonBox width={90} height={28} radius={8} />
          <SkeletonBox width={240} height={14} radius={7} />
          <SkeletonBox width={210} height={14} radius={7} />
        </View>
        <View style={[styles.headerIcon, { backgroundColor: c.surface, borderColor: c.border }]} />
      </View>

      <View style={[styles.heroCard, { borderColor: c.border }]}>
        <SkeletonBox width="34%" height={12} radius={6} />
        <SkeletonBox width="48%" height={30} radius={8} />
        <SkeletonBox width="78%" height={14} radius={7} />
        <View style={styles.heroStats}>
          {[0, 1].map((item) => (
            <View key={item} style={[styles.heroStatCard, { borderColor: 'rgba(255,255,255,0.08)' }]}>
              <SkeletonBox width="40%" height={24} radius={8} />
              <SkeletonBox width="55%" height={12} radius={6} />
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.addressCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <SkeletonBox width={110} height={12} radius={6} />
        <SkeletonBox width="88%" height={18} radius={7} />
        <SkeletonBox width="42%" height={12} radius={6} />
      </View>

      <View style={styles.assetSection}>
        <SkeletonBox width={120} height={18} radius={6} />
        <SkeletonBox width="72%" height={12} radius={6} />
      </View>

      <View style={styles.assetList}>
        {[0, 1].map((item) => (
          <View key={item} style={[styles.assetCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={[styles.assetImage, styles.assetImageFallback, { backgroundColor: c.border }]} />
            <View style={styles.assetBody}>
              <View style={styles.assetTop}>
                <View style={styles.assetTopLeft}>
                  <SkeletonBox width="68%" height={18} radius={7} />
                  <SkeletonBox width="42%" height={12} radius={6} />
                  <SkeletonBox width={60} height={22} radius={11} />
                </View>
                <SkeletonBox width={84} height={26} radius={13} />
              </View>
              <View style={styles.assetMetrics}>
                {[0, 1, 2].map((metric) => (
                  <View key={metric} style={styles.assetMetricItem}>
                    <SkeletonBox width="60%" height={10} radius={5} />
                    <SkeletonBox width="82%" height={14} radius={6} />
                  </View>
                ))}
              </View>
              <View style={styles.assetBottom}>
                <SkeletonBox width={96} height={10} radius={5} />
                <SkeletonBox width={16} height={16} radius={8} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default function WalletRoute() {
  const c = useThemeColors();
  const { wallet, user, isLoading, isRefreshing, error, reload } = useWallet();
  const [copied, setCopied] = useState(false);

  useFocusEffect(useCallback(() => {
    void reload();
  }, [reload]));

  async function handleCopyWalletAddress() {
    if (wallet?.address === '-' || !wallet?.address) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <WalletLoadingSkeleton />
      </SafeAreaView>
    );
  }

  if (!wallet) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <View style={styles.centerState}>
          <Text style={[styles.emptyTitle, { color: c.foreground }]}>Wallet unavailable</Text>
          <Text style={[styles.emptyText, { color: c.textMuted }]}>
            {error ?? 'We could not load your wallet data.'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: c.accent }]}
            onPress={reload}
            activeOpacity={0.85}
          >
            <Text style={[styles.retryButtonText, { color: c.accentContrast }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={reload}
            tintColor={c.accent}
          />
        )}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: c.foreground }]}>Wallet</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              View your connected wallet and every minted recycling asset in one place.
            </Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="wallet-outline" size={18} color={c.accent} />
          </View>
        </View>

        <View style={[styles.heroCard, { borderColor: c.border }]}>
          <View style={[styles.heroGlow, { backgroundColor: c.heroGlowColor }]} />
          <Text style={styles.heroLabel}>Supplier Account</Text>
          <Text style={styles.heroAddress}>{user?.display_name ?? 'Supplier'}</Text>
          <Text style={styles.heroHint}>
            Minted batches appear here after the blockchain record is created successfully.
          </Text>

          <View style={styles.heroStats}>
            <View style={[styles.heroStatCard, { borderColor: 'rgba(255,255,255,0.08)' }]}>
              <Text style={styles.heroStatValue}>{wallet.cnftCount}</Text>
              <Text style={styles.heroStatLabel}>Assets</Text>
            </View>
            <View style={[styles.heroStatCard, { borderColor: 'rgba(255,255,255,0.08)' }]}>
              <Text style={styles.heroStatValue}>
                {wallet.address === '-' ? 'No' : 'Yes'}
              </Text>
              <Text style={styles.heroStatLabel}>Wallet Linked</Text>
            </View>
          </View>
        </View>

        <View style={[styles.addressCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.addressRow}>
            <Text style={[styles.addressLabel, { color: c.textMuted }]}>Wallet Address</Text>
            {wallet.address !== '-' ? (
              <TouchableOpacity
                style={[styles.copyButton, { borderColor: c.border, backgroundColor: c.background }]}
                onPress={handleCopyWalletAddress}
                activeOpacity={0.8}
              >
                <Ionicons name={copied ? 'checkmark-outline' : 'copy-outline'} size={14} color={copied ? c.accent : c.textSecondary} />
                <Text style={[styles.copyButtonText, { color: copied ? c.accent : c.textSecondary }]}>
                  {copied ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Ionicons name="wallet-outline" size={16} color={c.textFaint} />
            )}
          </View>
          <Text style={[styles.addressValue, { color: c.foreground }]}>
            {wallet.address === '-' ? 'No wallet connected yet' : shortAddress(wallet.address)}
          </Text>
          {wallet.address !== '-' ? (
            <Text style={[styles.addressHint, { color: c.textMuted }]}>
              Tap copy to use the full wallet address.
            </Text>
          ) : null}
        </View>

        <View style={styles.assetSection}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Minted Assets</Text>
          {error ? (
            <Text style={[styles.sectionHint, { color: c.textMuted }]}>
              Last refresh returned an error: {error}
            </Text>
          ) : (
            <Text style={[styles.sectionHint, { color: c.textMuted }]}>
              Each item below is derived from a minted batch with a live cNFT record.
            </Text>
          )}
        </View>

        {wallet.cnfts.length > 0 ? (
          <View style={styles.assetList}>
            {wallet.cnfts.map((asset) => (
              <TouchableOpacity
                key={asset.batchId}
                style={[styles.assetCard, { backgroundColor: c.surface, borderColor: c.border }]}
                onPress={() => router.push(`/wallet/cnft/${asset.batchId}` as never)}
                activeOpacity={0.8}
              >
                {asset.imageUrl ? (
                  <Image
                    source={{ uri: asset.imageUrl }}
                    style={styles.assetImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.assetImage, styles.assetImageFallback, { backgroundColor: c.border }]}>
                    <Ionicons name="image-outline" size={28} color={c.textMuted} />
                  </View>
                )}

                <View style={styles.assetBody}>
                  <View style={styles.assetTop}>
                    <View style={styles.assetTopLeft}>
                      <Text style={[styles.assetTitle, { color: c.foreground }]}>
                        {asset.materialType} · {asset.weightKg.toFixed(1)} kg
                      </Text>
                      <Text style={[styles.assetSubtitle, { color: c.textMuted }]}>
                        Asset {shortAddress(asset.assetId)}
                      </Text>
                      <MaterialBadge material={asset.materialType} />
                    </View>
                    <AssetStatusPill status={asset.status} />
                  </View>

                  <View style={styles.assetMetrics}>
                    <View style={styles.assetMetricItem}>
                      <Text style={[styles.assetMetricLabel, { color: c.textMuted }]}>Asset ID</Text>
                      <Text style={[styles.assetMetricValue, { color: c.foreground }]}>{shortAddress(asset.assetId)}</Text>
                    </View>
                    <View style={styles.assetMetricItem}>
                      <Text style={[styles.assetMetricLabel, { color: c.textMuted }]}>Proof</Text>
                      <Text style={[styles.assetMetricValue, { color: c.foreground }]}>
                        {asset.txSignature ? 'On-chain' : 'Pending'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.assetBottom}>
                    <Text style={[styles.assetBottomText, { color: c.textMuted }]}>
                      Minted {formatDate(asset.mintedAt)}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color={c.textFaint} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="wallet-outline" size={20} color={c.accent} />
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>No minted assets yet.</Text>
            <Text style={[styles.emptyText, { color: c.textMuted }]}>
              Complete a batch until the `minted` status to see it appear in this wallet.
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
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
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
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  copyButtonText: {
    fontSize: FontSize.xs,
    fontFamily: Font.semiBold,
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
  skeletonHeaderCopy: {
    gap: 10,
    flex: 1,
  },
  addressHint: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 20,
  },
  assetSection: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: Font.bold,
  },
  sectionHint: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 20,
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
  assetSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 18,
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
  assetImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    marginTop: 8,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: FontSize.md,
    fontFamily: Font.semiBold,
  },
});
