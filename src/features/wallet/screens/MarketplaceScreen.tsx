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
import { useListings } from '@/src/features/wallet/hooks/useListings';
import { CreateListingModal } from '@/src/features/wallet/components/CreateListingModal';
import { usePrivy } from '@privy-io/react-auth';
import { getBrowseListings } from '@/src/features/wallet/services/listing-api';
import type { CNFT, Listing } from '@/types';

const COMING_SOON = true;

type ActiveTab = 'browse' | 'my-assets';

const MATERIAL_FILTERS = ['All', 'PET', 'HDPE', 'LDPE', 'PP', 'MIX'] as const;

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function shortId(id: string) {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Browse listing card ────────────────────────────────────────────────────

function ListingCard({ listing }: { listing: Listing }) {
  const c = useThemeColors();
  const material = listing.material.toUpperCase();

  return (
    <View style={[styles.listingCard, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.listingCardTop}>
        <View style={styles.listingCardLeft}>
          <MaterialBadge material={material as never} />
          <Text style={[styles.listingTitle, { color: c.foreground }]}>
            {material} · {listing.weight_grams ? `${(listing.weight_grams / 1000).toFixed(1)} kg` : '— kg'}
          </Text>
          {listing.note ? (
            <Text style={[styles.listingNote, { color: c.textMuted }]} numberOfLines={2}>
              {listing.note}
            </Text>
          ) : null}
        </View>
        <View style={[styles.priceTag, { backgroundColor: `${c.accent}18`, borderColor: `${c.accent}44` }]}>
          <Text style={[styles.priceTagText, { color: c.accent }]}>{formatIDR(listing.price_idr)}</Text>
        </View>
      </View>

      <View style={[styles.listingCardDivider, { backgroundColor: c.border }]} />

      <View style={styles.listingCardBottom}>
        {listing.asset_id ? (
          <Text style={[styles.listingMeta, { color: c.textMuted }]}>
            Asset {shortId(listing.asset_id)}
          </Text>
        ) : null}
        <Text style={[styles.listingMeta, { color: c.textFaint }]}>
          Listed {formatDate(listing.listed_at)}
        </Text>
      </View>
    </View>
  );
}

// ─── My asset card ──────────────────────────────────────────────────────────

function MyAssetCard({
  asset,
  listing,
  onSell,
  onCancel,
}: {
  asset: CNFT;
  listing?: Listing;
  onSell: () => void;
  onCancel: (listingId: string) => void;
}) {
  const c = useThemeColors();
  const isListed = listing?.status === 'active';
  const isSold   = listing?.status === 'sold';

  return (
    <TouchableOpacity
      style={[styles.assetCard, { backgroundColor: c.surface, borderColor: isListed ? c.accent : c.border }]}
      onPress={() => router.push(`/wallet/cnft/${asset.batchId}` as never)}
      activeOpacity={0.8}
    >
      {asset.imageUrl ? (
        <Image source={{ uri: asset.imageUrl }} style={styles.assetImage} contentFit="cover" />
      ) : (
        <View style={[styles.assetImage, styles.assetImageFallback, { backgroundColor: c.border }]}>
          <Ionicons name="image-outline" size={28} color={c.textMuted} />
        </View>
      )}

      <View style={styles.assetBody}>
        <View style={styles.assetRow}>
          <View style={{ gap: 4, flex: 1 }}>
            <Text style={[styles.assetTitle, { color: c.foreground }]}>
              {asset.materialType} · {asset.weightKg.toFixed(1)} kg
            </Text>
            <Text style={[styles.assetSub, { color: c.textMuted }]}>
              Asset {shortId(asset.assetId)}
            </Text>
            <MaterialBadge material={asset.materialType} />
          </View>

          {/* Status / action */}
          {isSold ? (
            <View style={[styles.soldBadge, { backgroundColor: `${c.accent}22` }]}>
              <Text style={[styles.soldBadgeText, { color: c.accent }]}>Sold</Text>
            </View>
          ) : isListed ? (
            <View style={styles.listedGroup}>
              <Text style={[styles.listedPrice, { color: c.accent }]}>{formatIDR(listing!.price_idr)}</Text>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: c.border }]}
                onPress={(e) => { e.stopPropagation(); onCancel(listing!.id); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelBtnText, { color: c.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.sellBtn, { backgroundColor: `${c.accent}18`, borderColor: `${c.accent}44` }]}
              onPress={(e) => { e.stopPropagation(); onSell(); }}
              activeOpacity={0.8}
            >
              <Ionicons name="pricetag-outline" size={13} color={c.accent} />
              <Text style={[styles.sellBtnText, { color: c.accent }]}>Sell</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.assetDate, { color: c.textFaint }]}>
          Minted {formatDate(asset.mintedAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Skeleton placeholders ──────────────────────────────────────────────────

function BrowseSkeleton() {
  const c = useThemeColors();
  return (
    <View style={{ gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.listingCard, { backgroundColor: c.surface, borderColor: c.border, gap: 12 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ gap: 8, flex: 1 }}>
              <SkeletonBox width={60} height={22} radius={11} />
              <SkeletonBox width="55%" height={16} radius={7} />
              <SkeletonBox width="80%" height={12} radius={6} />
            </View>
            <SkeletonBox width={90} height={36} radius={12} />
          </View>
          <SkeletonBox width="100%" height={1} radius={0} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <SkeletonBox width="40%" height={12} radius={6} />
            <SkeletonBox width="30%" height={12} radius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────

export default function MarketplaceScreen() {
  const c = useThemeColors();

  // ── All hooks must be called unconditionally before any early return ──
  const { getAccessToken } = usePrivy();

  const [activeTab, setActiveTab] = useState<ActiveTab>('browse');
  const [materialFilter, setMaterialFilter] = useState<string>('Semua');
  const [browseListings, setBrowseListings] = useState<Listing[]>([]);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [browseRefreshing, setBrowseRefreshing] = useState(false);

  const { wallet, isLoading: walletLoading, isRefreshing: walletRefreshing, reload: reloadWallet } = useWallet();
  const { listingByBatchId, create, cancel, reload: reloadListings } = useListings();
  const [listingTarget, setListingTarget] = useState<CNFT | null>(null);

  const loadBrowse = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    const data = await getBrowseListings(token, { limit: 30 });
    setBrowseListings(data);
  }, [getAccessToken]);

  const refreshBrowse = useCallback(async () => {
    setBrowseRefreshing(true);
    try { await loadBrowse(); } finally { setBrowseRefreshing(false); }
  }, [loadBrowse]);

  useFocusEffect(useCallback(() => {
    setBrowseLoading(true);
    loadBrowse().finally(() => setBrowseLoading(false));
    void reloadWallet();
    void reloadListings();
  }, [loadBrowse, reloadWallet, reloadListings]));

  if (COMING_SOON) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.comingSoonContainer}>
          <View style={[styles.comingSoonIcon, { backgroundColor: `${c.accent}18`, borderColor: `${c.accent}33` }]}>
            <Ionicons name="storefront-outline" size={36} color={c.accent} />
          </View>
          <Text style={[styles.comingSoonTitle, { color: c.foreground }]}>Marketplace</Text>
          <View style={[styles.comingSoonBadge, { backgroundColor: `${c.accent}18`, borderColor: `${c.accent}33` }]}>
            <Text style={[styles.comingSoonBadgeText, { color: c.accent }]}>Coming Soon</Text>
          </View>
          <Text style={[styles.comingSoonDesc, { color: c.textMuted }]}>
            Buy and sell verified recycling assets directly on-chain. We&apos;re putting the finishing touches on it.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredListings = materialFilter === 'All'
    ? browseListings
    : browseListings.filter((l) => l.material.toUpperCase() === materialFilter);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <View>
          <Text style={[styles.title, { color: c.foreground }]}>Marketplace</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Buy and sell verified recycling assets
          </Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Ionicons name="storefront-outline" size={18} color={c.accent} />
        </View>
      </View>

      {/* Tab switcher */}
      <View style={[styles.tabSwitcher, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        {(['browse', 'my-assets'] as ActiveTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabBtn,
              activeTab === tab && { borderBottomColor: c.accent, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.tabBtnText,
              { color: activeTab === tab ? c.accent : c.textMuted },
              activeTab === tab && { fontFamily: Font.semiBold },
            ]}>
              {tab === 'browse' ? 'Browse' : 'My Assets'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Browse tab ── */}
      {activeTab === 'browse' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={browseRefreshing} onRefresh={refreshBrowse} tintColor={c.accent} />}
        >
          {/* Material filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {MATERIAL_FILTERS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: materialFilter === m ? c.accent : c.surface,
                    borderColor: materialFilter === m ? c.accent : c.border,
                  },
                ]}
                onPress={() => setMaterialFilter(m)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, { color: materialFilter === m ? c.accentContrast : c.textSecondary }]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {browseLoading ? (
            <BrowseSkeleton />
          ) : filteredListings.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name="storefront-outline" size={20} color={c.accent} />
              <Text style={[styles.emptyTitle, { color: c.foreground }]}>No listings yet</Text>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>
                No assets are listed for sale{materialFilter !== 'All' ? ` for ${materialFilter}` : ''}.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {filteredListings.map((l) => <ListingCard key={l.id} listing={l} />)}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── My Assets tab ── */}
      {activeTab === 'my-assets' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={walletRefreshing}
              onRefresh={async () => { await reloadWallet(); await reloadListings(); }}
              tintColor={c.accent}
            />
          }
        >
          {walletLoading ? (
            <View style={{ gap: 12 }}>
              {[0, 1].map((i) => (
                <View key={i} style={[styles.assetCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <SkeletonBox width="100%" height={160} radius={0} />
                  <View style={{ padding: 14, gap: 10 }}>
                    <SkeletonBox width="60%" height={18} radius={7} />
                    <SkeletonBox width="40%" height={12} radius={6} />
                    <SkeletonBox width={60} height={22} radius={11} />
                  </View>
                </View>
              ))}
            </View>
          ) : !wallet || wallet.cnfts.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name="cube-outline" size={20} color={c.accent} />
              <Text style={[styles.emptyTitle, { color: c.foreground }]}>No assets yet</Text>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>
                Complete a batch until the minted status to see your assets here.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {wallet.cnfts.map((asset) => (
                <MyAssetCard
                  key={asset.batchId}
                  asset={asset}
                  listing={listingByBatchId[asset.batchId]}
                  onSell={() => setListingTarget(asset)}
                  onCancel={cancel}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <CreateListingModal
        asset={listingTarget}
        visible={listingTarget !== null}
        onClose={() => setListingTarget(null)}
        onSubmit={create}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontFamily: Font.bold,
    lineHeight: 28,
  },
  subtitle: {
    marginTop: 4,
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSwitcher: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnText: {
    fontSize: FontSize.md,
    fontFamily: Font.medium,
  },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 12, paddingBottom: 36 },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
  },
  // Listing card
  listingCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  listingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  listingCardLeft: { flex: 1, gap: 6 },
  listingTitle: {
    fontSize: FontSize.md,
    fontFamily: Font.semiBold,
  },
  listingNote: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 18,
  },
  priceTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceTagText: {
    fontSize: FontSize.sm,
    fontFamily: Font.bold,
  },
  listingCardDivider: { height: 1 },
  listingCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listingMeta: {
    fontSize: FontSize.xs,
    fontFamily: Font.regular,
  },
  // Asset card
  assetCard: {
    borderWidth: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  assetImage: { width: '100%', height: 160 },
  assetImageFallback: { alignItems: 'center', justifyContent: 'center' },
  assetBody: { padding: 14, gap: 8 },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  assetTitle: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  assetSub: { fontSize: FontSize.sm, fontFamily: Font.regular },
  assetDate: { fontSize: FontSize.xs, fontFamily: Font.regular },
  soldBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  soldBadgeText: { fontSize: FontSize.xs, fontFamily: Font.semiBold },
  listedGroup: { alignItems: 'flex-end', gap: 6 },
  listedPrice: { fontSize: FontSize.sm, fontFamily: Font.bold },
  cancelBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  cancelBtnText: { fontSize: FontSize.xs, fontFamily: Font.medium },
  sellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sellBtnText: { fontSize: FontSize.xs, fontFamily: Font.semiBold },
  // Coming soon
  comingSoonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 16,
  },
  comingSoonIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  comingSoonTitle: {
    fontSize: FontSize['2xl'],
    fontFamily: Font.bold,
  },
  comingSoonBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  comingSoonBadgeText: {
    fontSize: FontSize.sm,
    fontFamily: Font.semiBold,
  },
  comingSoonDesc: {
    fontSize: FontSize.md,
    fontFamily: Font.regular,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 4,
  },
  // Empty
  emptyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    alignItems: 'flex-start',
    gap: 10,
  },
  emptyTitle: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  emptyText: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
});
