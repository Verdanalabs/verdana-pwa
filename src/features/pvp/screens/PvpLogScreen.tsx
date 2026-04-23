import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { usePvpBatchFeed } from '@/src/features/pvp/hooks/usePvpBatchFeed';
import type { PvpBatchListItem } from '@/src/features/batch/services/batch-api';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  cosigning: { label: 'Awaiting Sign', color: '#8b5cf6', icon: 'hourglass-outline' },
  cosigned: { label: 'Co-signed', color: '#06b6d4', icon: 'checkmark-done-outline' },
  minted: { label: 'Asset Minted', color: '#10b981', icon: 'leaf-outline' },
  mint_pending: { label: 'Minting', color: '#84cc16', icon: 'sync-outline' },
  mint_failed: { label: 'Mint Failed', color: '#ef4444', icon: 'alert-circle-outline' },
};

const LOG_STATUSES = new Set(['cosigning', 'cosigned', 'minted', 'mint_pending', 'mint_failed']);

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function weightKg(item: PvpBatchListItem) {
  const grams = item.actual_weight_grams ?? item.estimated_weight_grams ?? 0;
  return (grams / 1000).toFixed(1);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function LogSkeleton() {
  const c = useThemeColors();

  return (
    <View style={styles.list}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.cardHeader}>
            <SkeletonBox width={110} height={12} radius={6} />
            <SkeletonBox width={92} height={22} radius={999} />
          </View>
          <SkeletonBox width="42%" height={22} radius={8} />
          <SkeletonBox width="30%" height={12} radius={6} />
          <View style={styles.cardMetaRow}>
            <SkeletonBox width={76} height={10} radius={5} />
            <SkeletonBox width={82} height={10} radius={5} />
          </View>
        </View>
      ))}
    </View>
  );
}

function LogCard({ item }: { item: PvpBatchListItem }) {
  const c = useThemeColors();
  const cfg = STATUS_CONFIG[item.status] ?? { label: item.status, color: c.textMuted, icon: 'ellipse-outline' };
  const activityAt = item.weighed_at ?? item.created_at;
  const isActual = !!item.actual_weight_grams;

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.batchMeta, { color: c.textMuted }]}>#{shortId(item.id)}</Text>
        <View style={[styles.statusPill, { backgroundColor: `${cfg.color}14`, borderColor: `${cfg.color}28` }]}>
          <Ionicons name={cfg.icon as never} size={12} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <Text style={[styles.weightText, { color: c.foreground }]}>
        {weightKg(item)} kg
        {!isActual && <Text style={[styles.estLabel, { color: c.textMuted }]}> estimated</Text>}
      </Text>

      <Text style={[styles.materialText, { color: c.textSecondary }]}>{item.material.toUpperCase()}</Text>

      <View style={styles.cardMetaRow}>
        <Text style={[styles.cardMetaText, { color: c.textMuted }]}>{formatDate(activityAt)}</Text>
        <Text style={[styles.cardMetaText, { color: c.textMuted }]}>{formatTime(activityAt)}</Text>
      </View>
    </View>
  );
}

export default function PvpLogScreen() {
  const c = useThemeColors();
  const { batches, isLoading, isRefreshing, error, reload } = usePvpBatchFeed();

  const logItems = [...batches]
    .filter((b) => LOG_STATUSES.has(b.status))
    .sort((a, b) => {
      const ta = new Date(a.weighed_at ?? a.created_at).getTime();
      const tb = new Date(b.weighed_at ?? b.created_at).getTime();
      return tb - ta;
    });

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: c.foreground }]}>Activity Log</Text>
        <Text style={[styles.pageSub, { color: c.textMuted }]}>
          {logItems.length} processed batch{logItems.length !== 1 ? 'es' : ''}
        </Text>
      </View>

      {isLoading && <LogSkeleton />}

      {!isLoading && error && (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={40} color={c.textMuted} />
          <Text style={[styles.stateText, { color: c.textMuted }]}>{error}</Text>
        </View>
      )}

      {!isLoading && !error && (
        <ScrollView
          contentContainerStyle={[styles.list, logItems.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          refreshControl={(
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => { void reload(); }}
              tintColor={c.accent}
            />
          )}
        >
          {logItems.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="document-text-outline" size={48} color={c.textMuted} />
              <Text style={[styles.stateTitle, { color: c.foreground }]}>No activity yet</Text>
              <Text style={[styles.stateText, { color: c.textMuted }]}>
                Processed batches will appear here once weigh-in and minting start.
              </Text>
            </View>
          ) : (
            logItems.map((item) => <LogCard key={item.id} item={item} />)
          )}
        </ScrollView>
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
    gap: 4,
  },
  pageTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize['2xl'],
  },
  pageSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  listEmpty: {
    flex: 1,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  batchMeta: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    letterSpacing: 0.3,
  },
  weightText: {
    fontFamily: Font.bold,
    fontSize: FontSize.xl,
  },
  estLabel: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
  },
  materialText: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMetaText: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.xs,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
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
});
