import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { acceptBatch, getPvpBatches, type PvpBatchListItem } from '@/src/features/batch/services/batch-api';

function materialLabel(m: string) {
  return m.toUpperCase();
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusColor(status: string): string {
  switch (status) {
    case 'pending': return '#f59e0b';
    case 'accepted': return '#3b82f6';
    case 'cosigning': return '#8b5cf6';
    default: return '#6b7280';
  }
}

function BatchCard({
  item,
  token,
  onAccepted,
}: {
  item: PvpBatchListItem;
  token: string;
  onAccepted: () => void;
}) {
  const c = useThemeColors();
  const [accepting, setAccepting] = useState(false);

  async function handleAccept() {
    setAccepting(true);
    try {
      await acceptBatch(token, item.id);
      onAccepted();
    } catch {
      // ignore — list will refresh on next focus
    } finally {
      setAccepting(false);
    }
  }

  const estKg = item.estimated_weight_grams != null
    ? (item.estimated_weight_grams / 1000).toFixed(1)
    : '—';

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardMeta}>
          <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: c.textSecondary }]}>{item.status.toUpperCase()}</Text>
        </View>
        <Text style={[styles.timeText, { color: c.textMuted }]}>{timeAgo(item.created_at)}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={[styles.cardLabel, { color: c.textMuted }]}>MATERIAL</Text>
          <Text style={[styles.cardValue, { color: c.foreground }]}>{materialLabel(item.material)}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={[styles.cardLabel, { color: c.textMuted }]}>EST. WEIGHT</Text>
          <Text style={[styles.cardValue, { color: c.foreground }]}>{estKg} kg</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={[styles.cardLabel, { color: c.textMuted }]}>BATCH ID</Text>
          <Text style={[styles.cardValue, { color: c.foreground }]}>{item.id.slice(0, 8).toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={[styles.acceptBtn, { backgroundColor: c.accent }]}
            onPress={handleAccept}
            activeOpacity={0.85}
            disabled={accepting}
          >
            {accepting
              ? <ActivityIndicator size="small" color={c.accentContrast} />
              : <Text style={[styles.acceptBtnText, { color: c.accentContrast }]}>Accept</Text>
            }
          </TouchableOpacity>
        )}
        {item.status === 'accepted' && (
          <TouchableOpacity
            style={[styles.scanBtn, { borderColor: c.accent }]}
            onPress={() => router.push(`/pvp/cosign?id=${item.id}` as never)}
            activeOpacity={0.85}
          >
            <Ionicons name="qr-code-outline" size={16} color={c.accent} />
            <Text style={[styles.scanBtnText, { color: c.accent }]}>Scan QR & Weigh</Text>
          </TouchableOpacity>
        )}
        {item.status === 'cosigning' && (
          <View style={[styles.waitingPill, { backgroundColor: '#8b5cf620', borderColor: '#8b5cf640' }]}>
            <Ionicons name="hourglass-outline" size={14} color="#8b5cf6" />
            <Text style={[styles.waitingText, { color: '#8b5cf6' }]}>Waiting for supplier</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function PendingSkeleton() {
  const c = useThemeColors();

  return (
    <View style={styles.list}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.cardHeader}>
            <SkeletonBox width="28%" height={12} radius={6} />
            <SkeletonBox width="18%" height={10} radius={5} />
          </View>
          <View style={styles.cardBody}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={styles.cardRow}>
                <SkeletonBox width="26%" height={10} radius={5} />
                <SkeletonBox width="30%" height={12} radius={6} />
              </View>
            ))}
          </View>
          <SkeletonBox width="100%" height={44} radius={12} />
        </View>
      ))}
    </View>
  );
}

export default function PvpPendingTab() {
  const c = useThemeColors();
  const { token } = usePvpAuth();
  const [batches, setBatches] = useState<PvpBatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPvpBatches(token);
      setBatches(data);
    } catch {
      setError('Failed to load batches');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const active = batches.filter(b => ['pending', 'accepted', 'cosigning'].includes(b.status));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: c.foreground }]}>PENDING</Text>
        <Text style={[styles.pageSub, { color: c.textMuted }]}>
          {active.length} active batch{active.length !== 1 ? 'es' : ''}
        </Text>
      </View>

      {loading && (
        <PendingSkeleton />
      )}

      {!loading && error && (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={40} color={c.textMuted} />
          <Text style={[styles.stateText, { color: c.textMuted }]}>{error}</Text>
          <TouchableOpacity onPress={load} activeOpacity={0.7}>
            <Text style={[styles.retryText, { color: c.accent }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && active.length === 0 && (
        <View style={styles.centerState}>
          <Ionicons name="time-outline" size={48} color={c.textMuted} />
          <Text style={[styles.stateTitle, { color: c.foreground }]}>No active batches</Text>
          <Text style={[styles.stateText, { color: c.textMuted }]}>
            Pending supplier requests will appear here.
          </Text>
        </View>
      )}

      {!loading && !error && active.length > 0 && (
        <FlatList
          data={active}
          keyExtractor={(b) => b.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BatchCard item={item} token={token!} onAccepted={load} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 2,
  },
  pageTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize.xl,
    letterSpacing: 0.8,
  },
  pageSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  stateTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize['2xl'],
    textAlign: 'center',
  },
  stateText: {
    fontFamily: Font.regular,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryText: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  timeText: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
  },
  cardBody: {
    gap: 8,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    letterSpacing: 0.4,
  },
  cardValue: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
  },
  cardActions: {
    paddingTop: 4,
  },
  acceptBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    fontFamily: Font.bold,
    fontSize: FontSize.md,
  },
  scanBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanBtnText: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
  },
  waitingPill: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  waitingText: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
  },
});
