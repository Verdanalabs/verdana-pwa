import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { acceptBatch, getPvpBatches, type PvpBatchListItem } from '@/src/features/batch/services/batch-api';
import { ApiError } from '@/src/shared/services/api';

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

function BatchCard({
  item,
  isAccepting,
  onAccept,
}: {
  item: PvpBatchListItem;
  isAccepting: boolean;
  onAccept: (batchId: string) => Promise<void>;
}) {
  const c = useThemeColors();
  const isPending = item.status === 'pending';
  const isAccepted = item.status === 'accepted';
  const matColor = MATERIAL_COLOR[item.material.toUpperCase()] ?? c.accent;

  return (
    <View style={[styles.batchCard, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.batchCardTop}>
        <Text style={[styles.batchMeta, { color: c.textMuted }]}>#{shortId(item.id)}</Text>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: isPending ? '#f59e0b16' : isAccepted ? `${c.accent}14` : '#8b5cf616',
              borderColor: isPending ? '#f59e0b2e' : isAccepted ? `${c.accent}26` : '#8b5cf62e',
            },
          ]}
        >
          <Text style={[styles.statusPillText, { color: isPending ? '#f59e0b' : isAccepted ? c.accent : '#8b5cf6' }]}>
            {isPending ? 'PENDING' : isAccepted ? 'READY TO WEIGH' : 'AWAITING SIGN'}
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
        <Text style={[styles.batchMetaText, { color: c.textMuted }]}>
          {isPending ? 'Needs review' : isAccepted ? 'Physical handoff' : 'Supplier action'}
        </Text>
      </View>

      {isPending && (
        <TouchableOpacity
          style={[styles.primaryAction, { backgroundColor: c.accent }]}
          onPress={() => { void onAccept(item.id); }}
          activeOpacity={0.86}
          disabled={isAccepting}
        >
          {isAccepting ? (
            <ActivityIndicator size="small" color={c.accentContrast} />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color={c.accentContrast} />
              <Text style={[styles.primaryActionText, { color: c.accentContrast }]}>Accept Batch</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {isAccepted && (
        <TouchableOpacity
          style={[styles.secondaryAction, { borderColor: c.accent, backgroundColor: `${c.accent}08` }]}
          onPress={() => router.push(`/pvp/cosign?id=${item.id}` as never)}
          activeOpacity={0.86}
        >
          <Ionicons name="qr-code-outline" size={18} color={c.accent} />
          <Text style={[styles.secondaryActionText, { color: c.accent }]}>Scan QR and Weigh</Text>
        </TouchableOpacity>
      )}

      {!isPending && !isAccepted && (
        <View style={[styles.waitingCard, { backgroundColor: '#8b5cf610', borderColor: '#8b5cf624' }]}>
          <Ionicons name="hourglass-outline" size={16} color="#8b5cf6" />
          <Text style={[styles.waitingText, { color: '#8b5cf6' }]}>Waiting for supplier confirmation</Text>
        </View>
      )}
    </View>
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
  const [actionError, setActionError] = useState<string | null>(null);
  const [acceptingBatchId, setAcceptingBatchId] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!token) return;

    if (mode === 'refresh') {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [pending, accepted, cosigning] = await Promise.all([
        getPvpBatches(token, 'pending'),
        getPvpBatches(token, 'accepted'),
        getPvpBatches(token, 'cosigning'),
      ]);

      setPendingBatches(pending);
      setAcceptedBatches(accepted);
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

  const handleAccept = useCallback(async (batchId: string) => {
    if (!token) return;

    setAcceptingBatchId(batchId);
    setActionError(null);

    try {
      await acceptBatch(token, batchId);
      await load('refresh');
    } catch (e) {
      if (e instanceof ApiError) {
        setActionError(e.message);
      } else {
        setActionError('Failed to accept batch');
      }
    } finally {
      setAcceptingBatchId(null);
    }
  }, [load, token]);

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
            <BatchCard
              key={item.id}
              item={item}
              isAccepting={acceptingBatchId === item.id}
              onAccept={handleAccept}
            />
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
              <QueueSummaryCard value={acceptedBatches.length} label="Ready to weigh" />
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

          {actionError && (
            <View style={[styles.errorCard, { backgroundColor: `${c.error}10`, borderColor: `${c.error}24` }]}>
              <Ionicons name="alert-circle-outline" size={16} color={c.error} />
              <Text style={[styles.errorCardText, { color: c.error }]}>{actionError}</Text>
            </View>
          )}

          {renderBatchSection('Ready To Weigh', 'Accepted batches that can move into physical handoff now', acceptedBatches)}
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
  primaryAction: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryActionText: {
    fontFamily: Font.bold,
    fontSize: FontSize.md,
  },
  secondaryAction: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryActionText: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
  },
  waitingCard: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  waitingText: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
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
  errorCard: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'flex-start',
  },
  errorCardText: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
