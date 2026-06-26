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
import { getInventory, type InventoryItem, type InventoryStatus } from '@/src/features/inventory/services/inventory-api';

const MATERIAL_FILTERS = ['All', 'PET', 'HDPE', 'LDPE', 'PP', 'MIX'] as const;
const STATUS_FILTERS: { key: 'All' | InventoryStatus; label: string }[] = [
  { key: 'All', label: 'All' },
  { key: 'in_stock', label: 'In Stock' },
  { key: 'reserved', label: 'Reserved' },
  { key: 'sold', label: 'Sold' },
  { key: 'depleted', label: 'Depleted' },
];

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const c = useThemeColors();
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { backgroundColor: selected ? c.accent : c.surface, borderColor: selected ? c.accent : c.border },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, { color: selected ? c.accentContrast : c.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function InventoryListScreen() {
  const c = useThemeColors();
  const { getAccessToken } = usePrivy();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [materialFilter, setMaterialFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | InventoryStatus>('All');

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
          <Ionicons name="bar-chart-outline" size={18} color={c.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.accent} />}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {MATERIAL_FILTERS.map((m) => (
            <Chip key={m} label={m} selected={materialFilter === m} onPress={() => setMaterialFilter(m)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {STATUS_FILTERS.map((s) => (
            <Chip key={s.key} label={s.label} selected={statusFilter === s.key} onPress={() => setStatusFilter(s.key)} />
          ))}
        </ScrollView>

        {error && !loading ? (
          <View style={{ marginTop: 4 }}>
            <LoadErrorCard message={error} onRetry={refresh} />
          </View>
        ) : loading ? (
          <View style={{ gap: 10, marginTop: 4 }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.skeletonCard, { backgroundColor: c.surface }]}>
                <SkeletonBox width="55%" height={16} radius={7} />
                <SkeletonBox width="35%" height={12} radius={6} />
              </View>
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="cube-outline" size={20} color={c.accent} />
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>No inventory yet</Text>
            <Text style={[styles.emptyText, { color: c.textMuted }]}>
              Finished goods appear here automatically once a batch becomes an Asset.
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 4 }}>
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
  content: { padding: 20, paddingTop: 14, gap: 10, paddingBottom: 36 },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: FontSize.sm, fontFamily: Font.medium },
  skeletonCard: { borderRadius: 14, padding: 14, gap: 10 },
  emptyCard: { borderWidth: 1, borderRadius: 18, padding: 18, alignItems: 'flex-start', gap: 10, marginTop: 4 },
  emptyTitle: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  emptyText: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
});
