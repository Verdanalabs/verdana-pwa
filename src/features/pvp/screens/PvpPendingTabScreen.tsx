import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { getPvpBatches, type PvpBatchListItem } from '@/src/features/batch/services/batch-api';

const MATERIAL_COLOR: Record<string, string> = {
  PET: '#3b82f6',
  HDPE: '#10b981',
  LDPE: '#f59e0b',
  PP: '#f97316',
  PVC: '#ef4444',
  PS: '#8b5cf6',
};

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function estimatedWeightKg(item: PvpBatchListItem) {
  if (item.estimated_weight_grams == null) return '-';
  return (item.estimated_weight_grams / 1000).toFixed(1);
}

function PendingSkeleton() {
  const c = useThemeColors();

  return (
    <View style={styles.list}>
      <View style={[styles.heroCard, { backgroundColor: c.surface, borderColor: c.border }]}>
        <SkeletonBox width="34%" height={12} radius={6} />
        <SkeletonBox width="52%" height={28} radius={10} />
        <View style={styles.summaryRow}>
          {[0, 1, 2].map((item) => (
            <View key={item} style={[styles.summaryCard, { backgroundColor: c.backgroundSoft, borderColor: c.border }]}>
              <SkeletonBox width={48} height={24} radius={8} />
              <SkeletonBox width={72} height={10} radius={5} />
            </View>
          ))}
        </View>
      </View>

      {[0, 1, 2].map((item) => (
        <View key={item} style={[styles.batchCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.batchCardTop}>
            <SkeletonBox width={100} height={12} radius={6} />
            <SkeletonBox width={90} height={22} radius={999} />
          </View>
          <SkeletonBox width="44%" height={18} radius={7} />
          <View style={styles.batchMetaRow}>
            <SkeletonBox width={90} height={10} radius={5} />
            <SkeletonBox width={80} height={10} radius={5} />
          </View>
          <SkeletonBox width="100%" height={44} radius={12} />
        </View>
      ))}
    </View>
  );
}

function QueueSummaryCard({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const c = useThemeColors();

  return (
    <View style={[styles.summaryCard, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }]}>
      <Text style={[styles.summaryValue, { color: c.white }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: c.ctaMuted }]}>{label}</Text>
    </View>
  );
}

function BatchCard({ item }: { item: PvpBatchListItem }) {
  const c = useThemeColors();
  const isPending = item.status === 'pending';
  const isDispatched = item.status === 'pickup_dispatched';
  const matColor = MATERIAL_COLOR[item.material.toUpperCase()] ?? c.accent;

  const statusLabel = isPending ? 'PENDING' : isDispatched ? 'EN ROUTE' : 'READY TO WEIGH';
  const statusColor = isPending ? '#f59e0b' : isDispatched ? '#8b5cf6' : c.accent;
  const nextStep = isPending ? 'Review' : isDispatched ? 'Scan & weigh' : 'Dispatch';
  const navigateTo = isPending
    ? `/pvp/batch-detail?id=${item.id}`
    : `/pvp/batch-detail?id=${item.id}`;

  return (
    <TouchableOpacity
      style={[styles.batchCard, { backgroundColor: c.surface, borderColor: c.border }]}
      activeOpacity={0.82}
      onPress={() => router.push(navigateTo as never)}
    >
      <View style={styles.batchCardTop}>
        <Text style={[styles.batchMeta, { color: c.textMuted }]}>#{shortId(item.id)}</Text>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: `${statusColor}16`,
              borderColor: `${statusColor}2e`,
            },
          ]}
        >
          <Text style={[styles.statusPillText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.batchTitleRow}>
        <View style={[styles.materialBadge, { backgroundColor: `${matColor}16`, borderColor: `${matColor}30` }]}>
          <Text style={[styles.materialBadgeText, { color: matColor }]}>{item.material.toUpperCase()}</Text>
        </View>
        <Text style={[styles.batchWeight, { color: c.foreground }]}>{estimatedWeightKg(item)} kg</Text>
      </View>

      <View style={styles.batchMetaRow}>
        <Text style={[styles.batchMetaText, { color: c.textMuted }]}>Submitted {timeAgo(item.created_at)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={[styles.batchMetaText, { color: c.textMuted }]}>
            {nextStep}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={c.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptySection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const c = useThemeColors();

  return (
    <View style={[styles.emptySection, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Text style={[styles.emptySectionTitle, { color: c.foreground }]}>{title}</Text>
      <Text style={[styles.emptySectionText, { color: c.textMuted }]}>{description}</Text>
    </View>
  );
}

export default function PvpPendingTab() {
  const c = useThemeColors();
  const { token } = usePvpAuth();
  const [pendingBatches, setPendingBatches] = useState<PvpBatchListItem[]>([]);
  const [acceptedBatches, setAcceptedBatches] = useState<PvpBatchListItem[]>([]);
  const [cosigningBatches, setCosigningBatches] = useState<PvpBatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!token) return;

    if (mode === 'refresh') {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [pending, accepted, dispatched, cosigning] = await Promise.all([
        getPvpBatches(token, 'pending'),
        getPvpBatches(token, 'accepted'),
        getPvpBatches(token, 'pickup_dispatched'),
        getPvpBatches(token, 'cosigning'),
      ]);
      setPendingBatches(pending);
      setAcceptedBatches([...accepted, ...dispatched]);
      setCosigningBatches(cosigning);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load batches');
    } finally {
      if (mode === 'refresh') {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    void load('initial');
  }, [load]));



  const activeCount = pendingBatches.length + acceptedBatches.length + cosigningBatches.length;

  const renderBatchSection = (title: string, subtitle: string, items: PvpBatchListItem[]) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionCopy}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>{title}</Text>
          <Text style={[styles.sectionSub, { color: c.textMuted }]}>{subtitle}</Text>
        </View>
        <View style={[styles.countPill, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.countPillText, { color: c.foreground }]}>{items.length}</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <EmptySection
          title={`No ${title.toLowerCase()}`}
          description={
            title === 'Ready To Weigh'
              ? 'Accepted batches will appear here before QR scan and weigh-in.'
              : title === 'Pending Review'
                ? 'New supplier submissions waiting for review will appear here.'
                : 'Weighed batches waiting for supplier confirmation will appear here.'
          }
        />
      ) : (
        <View style={styles.sectionList}>
          {items.map((item) => (
            <BatchCard key={item.id} item={item} />
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: c.accent }]}>QUEUE</Text>
        <Text style={[styles.pageTitle, { color: c.foreground }]}>Pending Operations</Text>
        <Text style={[styles.pageSub, { color: c.textMuted }]}>
          Review incoming requests, move ready batches into weigh-in, and track supplier confirmation.
        </Text>
      </View>

      {loading && <PendingSkeleton />}

      {!loading && error && (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={40} color={c.textMuted} />
          <Text style={[styles.stateText, { color: c.textMuted }]}>{error}</Text>
          <TouchableOpacity onPress={() => { void load('initial'); }} activeOpacity={0.7}>
            <Text style={[styles.retryText, { color: c.accent }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={(
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => { void load('refresh'); }}
              tintColor={c.accent}
            />
          )}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={[c.heroGradient[0], c.heroGradient[1], c.heroGradient[2]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { borderColor: c.border }]}
          >
            <Text style={[styles.heroTitle, { color: c.white }]}>{activeCount} active batches</Text>
            <Text style={[styles.heroSub, { color: c.ctaMuted }]}>
              Prioritize ready-to-weigh items first, then review new submissions.
            </Text>

            <View style={styles.summaryRow}>
              <QueueSummaryCard value={acceptedBatches.length} label="Active" />
              <QueueSummaryCard value={pendingBatches.length} label="Pending review" />
              <QueueSummaryCard value={cosigningBatches.length} label="Awaiting sign" />
            </View>
          </LinearGradient>

          {activeCount === 0 && (
            <View style={styles.centerState}>
              <Ionicons name="time-outline" size={48} color={c.textMuted} />
              <Text style={[styles.stateTitle, { color: c.foreground }]}>No active batches</Text>
              <Text style={[styles.stateText, { color: c.textMuted }]}>
                New supplier requests will appear here when the queue becomes active.
              </Text>
            </View>
          )}



          {renderBatchSection('Active Batches', 'Accepted and dispatched batches — scan QR to weigh', acceptedBatches)}
          {renderBatchSection('Pending Review', 'Supplier submissions that need to be accepted first', pendingBatches)}
          {renderBatchSection('Awaiting Supplier Approval', 'Weighed batches waiting for supplier confirmation', cosigningBatches)}
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
    gap: 6,
  },
  eyebrow: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.6,
  },
  pageTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize['2xl'],
  },
  pageSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 20,
    maxWidth: '94%',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 28,
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
    gap: 18,
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    overflow: 'hidden',
  },
  heroTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize['2xl'],
  },
  heroSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 4,
  },
  summaryValue: {
    fontFamily: Font.bold,
    fontSize: FontSize['2xl'],
  },
  summaryLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionCopy: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize.lg,
  },
  sectionSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    marginTop: 3,
    lineHeight: 18,
  },
  countPill: {
    minWidth: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  countPillText: {
    fontFamily: Font.bold,
    fontSize: FontSize.sm,
  },
  sectionList: {
    gap: 12,
  },
  batchCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  batchCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  batchMeta: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    letterSpacing: 0.3,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: {
    fontFamily: Font.bold,
    fontSize: FontSize.xs,
  },
  batchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  materialBadge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  materialBadgeText: {
    fontFamily: Font.bold,
    fontSize: FontSize.xs,
  },
  batchWeight: {
    fontFamily: Font.bold,
    fontSize: FontSize.xl,
  },
  batchMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  batchMetaText: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
  },

  emptySection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  emptySectionTitle: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
  },
  emptySectionText: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

});
