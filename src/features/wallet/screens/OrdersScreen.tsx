import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/react-auth';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { LoadErrorCard } from '@/src/shared/ui/LoadErrorCard';
import { OrderStatusBadge } from '@/src/features/wallet/components/OrderStatusBadge';
import { getOrders } from '@/src/features/wallet/services/order-api';
import type { Order } from '@/types';

type Role = 'buying' | 'selling';

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const c = useThemeColors();
  const material = order.material ? order.material.toUpperCase() : 'Asset';
  const weight = order.weight_grams ? `${(order.weight_grams / 1000).toFixed(1)} kg` : '';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.cardTitle, { color: c.foreground }]}>
            {material}{weight ? ` · ${weight}` : ''}
          </Text>
          <Text style={[styles.cardPrice, { color: c.accentInk }]}>{formatIDR(order.price_idr)}</Text>
        </View>
        <OrderStatusBadge status={order.status} size="sm" />
      </View>
      <Text style={[styles.cardMeta, { color: c.textFaint }]}>Ordered {formatDate(order.created_at)}</Text>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const c = useThemeColors();
  const { getAccessToken } = usePrivy();

  const [role, setRole] = useState<Role>('buying');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const token = await getAccessToken();
      if (!token) return;
      setOrders(await getOrders(token, role));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders');
    }
  }, [getAccessToken, role]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  // Reload when the buying/selling toggle changes.
  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  // Reload on focus return (e.g. after acting on an order).
  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>My Orders</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={[styles.toggle, { borderBottomColor: c.border, backgroundColor: c.surface }]}>
        {(['buying', 'selling'] as Role[]).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.toggleBtn, role === r && { borderBottomColor: c.accent, borderBottomWidth: 2 }]}
            onPress={() => setRole(r)}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, { color: role === r ? c.accent : c.textMuted }, role === r && { fontFamily: Font.semiBold }]}>
              {r === 'buying' ? 'Buying' : 'Selling'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={c.accentInk} />}
      >
        {error && !loading ? (
          <LoadErrorCard message={error} onRetry={refresh} />
        ) : loading ? (
          <View style={{ gap: 10 }}>
            {[0, 1].map((i) => (
              <View key={i} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, gap: 10 }]}>
                <SkeletonBox width="55%" height={16} radius={7} />
                <SkeletonBox width="35%" height={12} radius={6} />
              </View>
            ))}
          </View>
        ) : orders.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="receipt-outline" size={20} color={c.accentInk} />
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>No orders yet</Text>
            <Text style={[styles.emptyText, { color: c.textMuted }]}>
              {role === 'buying' ? 'Orders you place will appear here.' : 'Orders for your listings will appear here.'}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} onPress={() => router.push(`/wallet/orders/${o.id}` as never)} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  toggle: { flexDirection: 'row', borderBottomWidth: 1 },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  toggleText: { fontSize: FontSize.md, fontFamily: Font.medium },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 10, paddingBottom: 36 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardTitle: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  cardPrice: { fontSize: FontSize.sm, fontFamily: Font.bold },
  cardMeta: { fontSize: FontSize.xs, fontFamily: Font.regular },
  emptyCard: { borderWidth: 1, borderRadius: 18, padding: 18, alignItems: 'flex-start', gap: 10 },
  emptyTitle: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  emptyText: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
});
