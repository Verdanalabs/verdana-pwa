import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/react-auth';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { LoadErrorCard } from '@/src/shared/ui/LoadErrorCard';
import { InventoryItemCard } from '@/src/features/inventory/components/InventoryItemCard';
import { InventoryFilterBar, type StatusFilterKey } from '@/src/features/inventory/components/InventoryFilterBar';
import { getInventory, type InventoryItem } from '@/src/features/inventory/services/inventory-api';

const MATERIAL_FILTERS = ['All', 'PET', 'HDPE', 'LDPE', 'PP', 'MIX'] as const;
const STATUS_FILTERS: { key: StatusFilterKey; label: string }[] = [
  { key: 'All', label: 'All' },
  { key: 'in_stock', label: 'In Stock' },
  { key: 'reserved', label: 'Reserved' },
  { key: 'sold', label: 'Sold' },
  { key: 'depleted', label: 'Depleted' },
];

export default function InventoryListScreen() {
  const c = useThemeColors();
  const { getAccessToken } = usePrivy();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [materialFilter, setMaterialFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('All');

  const load = useCallback(async () => {
    try {
      setError(null);
      const token = await getAccessToken();
      if (!token) return;
      const data = await getInventory(token, { limit: 100 });
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inventory');
    }
  }, [getAccessToken]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]));

  const clearFilters = useCallback(() => {
    setMaterialFilter('All');
    setStatusFilter('All');
  }, []);

  const filtered = items.filter((it) =>
    (materialFilter === 'All' || it.material.toUpperCase() === materialFilter) &&
    (statusFilter === 'All' || it.status === statusFilter)
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={c.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.foreground }]}>Inventory</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>Your finished-goods stock</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/inventory/analytics' as never)}
          style={[styles.iconBtn, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}
          activeOpacity={0.7}
        >
          <Ionicons name="bar-chart-outline" size={18} color={c.accentInk} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.accentInk} />}
      >
        {!loading && !error && items.length > 0 ? (
          <InventoryFilterBar
            materials={MATERIAL_FILTERS}
            material={materialFilter}
            onMaterialChange={setMaterialFilter}
            statuses={STATUS_FILTERS}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            resultCount={filtered.length}
            totalCount={items.length}
            onClear={clearFilters}
          />
        ) : null}

        {error && !loading ? (
          <LoadErrorCard message={error} onRetry={refresh} />
        ) : loading ? (
          <View style={{ gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.skeletonCard, { backgroundColor: c.surface }]}>
                <View style={[styles.skeletonAccent, { backgroundColor: c.border }]} />
                <View style={styles.skeletonBody}>
                  <View style={styles.skeletonTopRow}>
                    <View style={styles.skeletonLeft}>
                      <SkeletonBox width="55%" height={15} radius={7} />
                      <SkeletonBox width="42%" height={20} radius={99} />
                    </View>
                    <SkeletonBox width={62} height={22} radius={99} />
                  </View>
                  <SkeletonBox width="34%" height={12} radius={6} />
                </View>
              </View>
            ))}
          </View>
        ) : items.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: c.backgroundElevated }]}>
              <Ionicons name="cube-outline" size={24} color={c.accentInk} />
            </View>
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>No inventory yet</Text>
            <Text style={[styles.emptyText, { color: c.textMuted }]}>
              Finished goods appear here automatically once a batch becomes an Asset.
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: c.backgroundElevated }]}>
              <Ionicons name="filter-outline" size={24} color={c.accentInk} />
            </View>
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>No matches</Text>
            <Text style={[styles.emptyText, { color: c.textMuted }]}>
              No items match the selected filters. Try a different material or status.
            </Text>
            <TouchableOpacity
              onPress={clearFilters}
              style={[styles.emptyCta, { borderColor: c.accentInk }]}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={16} color={c.accentInk} />
              <Text style={[styles.emptyCtaText, { color: c.accentInk }]}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {filtered.map((it) => (
              <InventoryItemCard key={it.id} item={it} onPress={() => router.push(`/inventory/${it.id}` as never)} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize['2xl'], fontFamily: Font.bold, lineHeight: 28 },
  subtitle: { marginTop: 2, fontSize: FontSize.sm, fontFamily: Font.regular },
  scroll: { flex: 1 },
  content: { padding: 20, paddingTop: 14, gap: 12, paddingBottom: 36 },
  skeletonCard: { borderRadius: 14, flexDirection: 'row', overflow: 'hidden' },
  skeletonAccent: { width: 4 },
  skeletonBody: { flex: 1, padding: 14, gap: 10 },
  skeletonTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  skeletonLeft: { flex: 1, gap: 8 },
  emptyCard: { borderWidth: 1, borderRadius: 18, padding: 22, alignItems: 'center', gap: 10 },
  emptyIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  emptyTitle: { fontSize: FontSize.lg, fontFamily: Font.semiBold, textAlign: 'center' },
  emptyText: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20, textAlign: 'center' },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginTop: 6,
  },
  emptyCtaText: { fontSize: FontSize.sm, fontFamily: Font.medium },
});
