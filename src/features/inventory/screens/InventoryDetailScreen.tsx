import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/react-auth';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { MaterialBadge } from '@/src/shared/ui/MaterialBadge';
import { PrimaryButton } from '@/src/shared/ui/PrimaryButton';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { LoadErrorCard } from '@/src/shared/ui/LoadErrorCard';
import { InventoryStatusBadge } from '@/src/features/inventory/components/InventoryStatusBadge';
import { AdjustStockModal } from '@/src/features/inventory/components/AdjustStockModal';
import {
  adjustStock,
  getInventoryItem,
  type InventoryItemDetail,
  type StockMovement,
} from '@/src/features/inventory/services/inventory-api';

const MOVEMENT_LABEL: Record<string, string> = {
  inbound: 'Stock In',
  outbound: 'Stock Out',
  adjustment: 'Adjustment',
  reserved: 'Reserved',
  released: 'Released',
};

function formatKg(grams: number): string {
  return `${(grams / 1000).toFixed(1)} kg`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MovementRow({ movement }: { movement: StockMovement }) {
  const c = useThemeColors();
  const positive = movement.delta_grams >= 0;
  return (
    <View style={[styles.movementRow, { borderColor: c.border }]}>
      <View style={[styles.movementDot, { backgroundColor: positive ? c.accent : c.error }]} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.movementTitle, { color: c.foreground }]}>
          {MOVEMENT_LABEL[movement.movement_type] ?? movement.movement_type}
        </Text>
        {movement.reason ? (
          <Text style={[styles.movementReason, { color: c.textMuted }]}>{movement.reason}</Text>
        ) : null}
        <Text style={[styles.movementMeta, { color: c.textFaint }]}>{formatDateTime(movement.created_at)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text style={[styles.movementDelta, { color: positive ? c.accent : c.error }]}>
          {positive ? '+' : ''}{formatKg(movement.delta_grams)}
        </Text>
        <Text style={[styles.movementBalance, { color: c.textMuted }]}>
          bal {formatKg(movement.balance_after_grams)}
        </Text>
      </View>
    </View>
  );
}

export default function InventoryDetailScreen() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getAccessToken } = usePrivy();

  const [item, setItem] = useState<InventoryItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const token = await getAccessToken();
      if (!token || !id) return;
      const data = await getInventoryItem(token, id);
      setItem(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inventory item');
    }
  }, [getAccessToken, id]);

  const reload = useCallback(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleAdjust = useCallback(async (params: { delta_grams: number; reason?: string }) => {
    const token = await getAccessToken();
    if (!token || !id) throw new Error('Not authenticated');
    await adjustStock(token, id, params);
    await load();
  }, [getAccessToken, id, load]);

  const material = item?.material.toUpperCase() ?? '';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Inventory Item</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error && !loading ? (
          <LoadErrorCard message={error} onRetry={reload} />
        ) : loading || !item ? (
          <View style={{ gap: 14 }}>
            <SkeletonBox width="100%" height={120} radius={18} />
            <SkeletonBox width="60%" height={18} radius={8} />
            <SkeletonBox width="100%" height={60} radius={12} />
          </View>
        ) : (
          <>
            <View style={[styles.heroCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={styles.heroTop}>
                <Text style={[styles.heroTitle, { color: c.foreground }]}>{material}</Text>
                <InventoryStatusBadge status={item.status} />
              </View>
              <Text style={[styles.heroWeight, { color: c.accentInk }]}>{formatKg(item.weight_grams)}</Text>
              <View style={styles.heroBadges}>
                <MaterialBadge material={material as never} />
                {item.grade ? (
                  <View style={[styles.gradePill, { borderColor: c.border }]}>
                    <Text style={[styles.gradeText, { color: c.textSecondary }]}>Grade {item.grade}</Text>
                  </View>
                ) : null}
                {item.category ? (
                  <View style={[styles.gradePill, { borderColor: c.border }]}>
                    <Text style={[styles.gradeText, { color: c.textSecondary }]}>{item.category}</Text>
                  </View>
                ) : null}
              </View>
              {item.asset_id ? (
                <Text style={[styles.assetText, { color: c.textMuted }]}>Asset {item.asset_id}</Text>
              ) : null}
            </View>

            {item.status !== 'sold' ? (
              <PrimaryButton label="Adjust Stock" variant="outline" onPress={() => setModalOpen(true)} />
            ) : null}

            <Text style={[styles.sectionTitle, { color: c.foreground }]}>Stock Movements</Text>
            {item.movements.length === 0 ? (
              <Text style={[styles.emptyText, { color: c.textMuted }]}>No movements recorded yet.</Text>
            ) : (
              <View style={{ gap: 8 }}>
                {item.movements.map((m) => <MovementRow key={m.id} movement={m} />)}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {item ? (
        <AdjustStockModal
          visible={modalOpen}
          currentWeightGrams={item.weight_grams}
          onClose={() => setModalOpen(false)}
          onSubmit={handleAdjust}
        />
      ) : null}
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
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  heroCard: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 12 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTitle: { fontSize: FontSize.xl, fontFamily: Font.bold },
  heroWeight: { fontSize: FontSize['3xl'], fontFamily: Font.bold },
  heroBadges: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  gradePill: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  gradeText: { fontSize: FontSize.xs, fontFamily: Font.medium },
  assetText: { fontSize: FontSize.sm, fontFamily: Font.regular },
  sectionTitle: { fontSize: FontSize.lg, fontFamily: Font.semiBold, marginTop: 4 },
  emptyText: { fontSize: FontSize.sm, fontFamily: Font.regular },
  movementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  movementDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  movementTitle: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  movementReason: { fontSize: FontSize.sm, fontFamily: Font.regular },
  movementMeta: { fontSize: FontSize.xs, fontFamily: Font.regular },
  movementDelta: { fontSize: FontSize.md, fontFamily: Font.bold },
  movementBalance: { fontSize: FontSize.xs, fontFamily: Font.regular },
});
