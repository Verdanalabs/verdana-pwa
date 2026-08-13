import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/react-auth';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { LoadErrorCard } from '@/src/shared/ui/LoadErrorCard';
import {
  getInventoryAnalytics,
  type InventoryAnalytics,
  type InventoryBucket,
} from '@/src/features/inventory/services/inventory-api';

function formatKg(grams: number): string {
  return `${(grams / 1000).toFixed(1)} kg`;
}

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function BreakdownCard({ title, buckets }: { title: string; buckets: InventoryBucket[] }) {
  const c = useThemeColors();
  const max = Math.max(1, ...buckets.map((b) => b.total_grams));

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Text style={[styles.cardTitle, { color: c.foreground }]}>{title}</Text>
      {buckets.length === 0 ? (
        <Text style={[styles.emptyText, { color: c.textMuted }]}>No data yet.</Text>
      ) : (
        <View style={{ gap: 12 }}>
          {buckets.map((b) => (
            <View key={b.key} style={{ gap: 6 }}>
              <View style={styles.rowBetween}>
                <Text style={[styles.bucketKey, { color: c.textSecondary }]}>{titleCase(b.key)}</Text>
                <Text style={[styles.bucketVal, { color: c.foreground }]}>
                  {formatKg(b.total_grams)} · {b.item_count}
                </Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: c.border }]}>
                <View
                  style={[styles.barFill, { backgroundColor: c.accent, width: `${(b.total_grams / max) * 100}%` }]}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function InventoryAnalyticsScreen() {
  const c = useThemeColors();
  const { getAccessToken } = usePrivy();

  const [data, setData] = useState<InventoryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const token = await getAccessToken();
      if (!token) return;
      setData(await getInventoryAnalytics(token));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics');
    }
  }, [getAccessToken]);

  const reload = useCallback(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Inventory Analytics</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error && !loading ? (
          <LoadErrorCard message={error} onRetry={reload} />
        ) : loading || !data ? (
          <View style={{ gap: 14 }}>
            <SkeletonBox width="100%" height={90} radius={18} />
            <SkeletonBox width="100%" height={160} radius={18} />
          </View>
        ) : (
          <>
            <View style={styles.totalsRow}>
              <View style={[styles.totalCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.totalValue, { color: c.accentInk }]}>{data.total_items}</Text>
                <Text style={[styles.totalLabel, { color: c.textMuted }]}>Total Items</Text>
              </View>
              <View style={[styles.totalCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.totalValue, { color: c.accentInk }]}>{formatKg(data.total_grams)}</Text>
                <Text style={[styles.totalLabel, { color: c.textMuted }]}>Total Weight</Text>
              </View>
            </View>

            <BreakdownCard title="By Material" buckets={data.by_material} />
            <BreakdownCard title="By Status" buckets={data.by_status} />
            <BreakdownCard title="By Grade" buckets={data.by_grade} />
            <BreakdownCard title="By Category" buckets={data.by_category} />
          </>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  totalsRow: { flexDirection: 'row', gap: 12 },
  totalCard: { flex: 1, borderWidth: 1, borderRadius: 18, padding: 16, gap: 6 },
  totalValue: { fontSize: FontSize['2xl'], fontFamily: Font.bold },
  totalLabel: { fontSize: FontSize.sm, fontFamily: Font.regular },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 14 },
  cardTitle: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bucketKey: { fontSize: FontSize.sm, fontFamily: Font.medium },
  bucketVal: { fontSize: FontSize.sm, fontFamily: Font.semiBold },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  emptyText: { fontSize: FontSize.sm, fontFamily: Font.regular },
});
