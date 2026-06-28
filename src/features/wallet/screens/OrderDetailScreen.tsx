import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/react-auth';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { useAuth } from '@/src/features/auth/state/auth-context';
import { MaterialBadge } from '@/src/shared/ui/MaterialBadge';
import { PrimaryButton } from '@/src/shared/ui/PrimaryButton';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { LoadErrorCard } from '@/src/shared/ui/LoadErrorCard';
import { OrderStatusBadge } from '@/src/features/wallet/components/OrderStatusBadge';
import {
  cancelOrder,
  completeOrder,
  confirmOrder,
  getOrder,
} from '@/src/features/wallet/services/order-api';
import type { Order } from '@/types';

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
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

function TimelineRow({ label, value, color }: { label: string; value?: string; color: string }) {
  const c = useThemeColors();
  if (!value) return null;
  return (
    <View style={styles.timelineRow}>
      <View style={[styles.timelineDot, { backgroundColor: color }]} />
      <Text style={[styles.timelineLabel, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.timelineValue, { color: c.textMuted }]}>{formatDateTime(value)}</Text>
    </View>
  );
}

export default function OrderDetailScreen() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getAccessToken } = usePrivy();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const token = await getAccessToken();
      if (!token || !id) return;
      setOrder(await getOrder(token, id));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load order');
    }
  }, [getAccessToken, id]);

  const reload = useCallback(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    reload();
  }, [reload]);

  const runAction = useCallback(
    async (action: (token: string, orderId: string) => Promise<Order>) => {
      if (!order) return;
      try {
        setBusy(true);
        setError(null);
        const token = await getAccessToken();
        if (!token) throw new Error('Not authenticated');
        const updated = await action(token, order.id);
        setOrder(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Action failed');
      } finally {
        setBusy(false);
      }
    },
    [getAccessToken, order],
  );

  const material = order?.material ? order.material.toUpperCase() : 'Asset';
  const isSeller = order != null && user != null && order.seller_user_id === user.id;
  const isParty = order != null && user != null && (order.seller_user_id === user.id || order.buyer_user_id === user.id);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Order</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loadError && !loading ? (
          <LoadErrorCard message={loadError} onRetry={reload} />
        ) : loading || !order ? (
          <View style={{ gap: 14 }}>
            <SkeletonBox width="100%" height={120} radius={18} />
            <SkeletonBox width="100%" height={120} radius={18} />
          </View>
        ) : (
          <>
            <View style={[styles.heroCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={styles.heroTop}>
                <Text style={[styles.heroTitle, { color: c.foreground }]}>{material}</Text>
                <OrderStatusBadge status={order.status} />
              </View>
              <Text style={[styles.price, { color: c.accent }]}>{formatIDR(order.price_idr)}</Text>
              <View style={styles.badgeRow}>
                {order.material ? <MaterialBadge material={material as never} /> : null}
                {order.weight_grams ? (
                  <Text style={[styles.weight, { color: c.textSecondary }]}>
                    {(order.weight_grams / 1000).toFixed(1)} kg
                  </Text>
                ) : null}
              </View>
              {order.note ? <Text style={[styles.note, { color: c.textMuted }]}>{order.note}</Text> : null}
            </View>

            <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Timeline</Text>
              <TimelineRow label="Ordered" value={order.created_at} color={c.accent} />
              <TimelineRow label="Confirmed" value={order.confirmed_at} color={c.info} />
              <TimelineRow label="Completed" value={order.completed_at} color={c.accent} />
              <TimelineRow label="Cancelled" value={order.cancelled_at} color={c.error} />
            </View>

            {error ? <Text style={[styles.errorText, { color: c.error }]}>{error}</Text> : null}

            <View style={{ gap: 10 }}>
              {isSeller && order.status === 'pending' ? (
                <PrimaryButton label="Confirm Order" onPress={() => runAction(confirmOrder)} loading={busy} />
              ) : null}
              {isParty && order.status === 'confirmed' ? (
                <PrimaryButton label="Mark Completed" onPress={() => runAction(completeOrder)} loading={busy} />
              ) : null}
              {isParty && (order.status === 'pending' || order.status === 'confirmed') ? (
                <PrimaryButton label="Cancel Order" variant="outline" onPress={() => runAction(cancelOrder)} loading={busy} />
              ) : null}
            </View>
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
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  heroCard: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 12 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTitle: { fontSize: FontSize.xl, fontFamily: Font.bold },
  price: { fontSize: FontSize['2xl'], fontFamily: Font.bold },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weight: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  note: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  sectionTitle: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timelineDot: { width: 8, height: 8, borderRadius: 4 },
  timelineLabel: { fontSize: FontSize.sm, fontFamily: Font.medium, flex: 1 },
  timelineValue: { fontSize: FontSize.xs, fontFamily: Font.regular },
  errorText: { fontSize: FontSize.sm, fontFamily: Font.regular },
});
