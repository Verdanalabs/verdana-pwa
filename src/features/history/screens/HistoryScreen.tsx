import { useCallback, useEffect, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/react-auth';
import { BatchCard } from '@/src/shared/ui/BatchCard';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { getBatches, type ApiBatch } from '@/src/features/batch/services/batch-api';
import type { BatchStatus, BatchSummary } from '@/types';

type StatusFilter = 'all' | 'pending' | 'accepted' | 'cosigning' | 'cosigned' | 'minted';
type MaterialFilter = 'all' | 'PET' | 'HDPE' | 'LDPE' | 'PP' | 'MIX';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'accepted',  label: 'Accepted' },
  { key: 'cosigning', label: 'Needs Approval' },
  { key: 'cosigned',  label: 'Co-signed' },
  { key: 'minted',    label: 'Asset Ready' },
];

const MATERIAL_FILTERS: MaterialFilter[] = ['all', 'PET', 'HDPE', 'LDPE', 'PP', 'MIX'];

function mapStatus(apiStatus: string): BatchStatus {
  switch (apiStatus) {
    case 'mint_pending':
    case 'mint_failed': return 'cosigned';
    default:            return apiStatus as BatchStatus;
  }
}

function uiStatusFilter(apiStatus: string): StatusFilter {
  switch (apiStatus) {
    case 'pending':     return 'pending';
    case 'accepted':    return 'accepted';
    case 'cosigning':   return 'cosigning';
    case 'cosigned':
    case 'mint_pending':
    case 'mint_failed': return 'cosigned';
    case 'minted':      return 'minted';
    default:            return 'pending';
  }
}

interface RichBatch {
  summary: BatchSummary;
  apiStatus: string;
  batchId: string;
}

function toRichBatch(b: ApiBatch): RichBatch {
  return {
    summary: {
      id: b.id,
      status: mapStatus(b.status),
      materialType: b.material.toUpperCase() as BatchSummary['materialType'],
      estimatedWeightKg: b.estimated_weight_grams != null ? b.estimated_weight_grams / 1000 : 0,
      pvpName: '',
      capturedAt: b.created_at,
    },
    apiStatus: b.status,
    batchId: b.id,
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const c = useThemeColors();
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected
          ? { backgroundColor: c.accent, borderColor: c.accent }
          : { backgroundColor: c.surface, borderColor: c.border },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipLabel, { color: selected ? c.accentContrast : c.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function HistoryLoadingSkeleton() {
  const c = useThemeColors();
  return (
    <>
      <View style={styles.metricsRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.metricCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <SkeletonBox width="45%" height={30} radius={8} />
            <SkeletonBox width="70%" height={12} radius={6} />
          </View>
        ))}
      </View>
      <View style={styles.filterSection}>
        <SkeletonBox width={64} height={14} radius={6} />
        <View style={styles.chipRowStatic}>
          {[80, 70, 110, 80, 90].map((w, i) => (
            <SkeletonBox key={i} width={w} height={36} radius={999} />
          ))}
        </View>
        <SkeletonBox width={72} height={14} radius={6} />
        <View style={styles.chipRowStatic}>
          {[60, 60, 70, 60, 60].map((w, i) => (
            <SkeletonBox key={i} width={w} height={36} radius={999} />
          ))}
        </View>
      </View>
      <View style={styles.skeletonList}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.skeletonCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.skeletonCardTop}>
              <SkeletonBox width="28%" height={12} radius={6} />
              <SkeletonBox width="18%" height={10} radius={5} />
            </View>
            <SkeletonBox width="54%" height={18} radius={7} />
            <SkeletonBox width="72%" height={12} radius={6} />
          </View>
        ))}
      </View>
    </>
  );
}

export default function HistoryRoute() {
  const c = useThemeColors();
  const { getAccessToken } = usePrivy();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [materialFilter, setMaterialFilter] = useState<MaterialFilter>('all');
  const [batches, setBatches] = useState<RichBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    try {
      if (mode === 'refresh') setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const data = await getBatches(token);
      setBatches(data.map(toRichBatch));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load batches');
    } finally {
      if (mode === 'refresh') setIsRefreshing(false);
      else setIsLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => { void load('initial'); }, [load]);
  useFocusEffect(useCallback(() => { void load('refresh'); }, [load]));

  const filteredBatches = useMemo(() => (
    batches.filter((b) => {
      const statusMatch = statusFilter === 'all' || uiStatusFilter(b.apiStatus) === statusFilter;
      const materialMatch = materialFilter === 'all' || b.summary.materialType === materialFilter;
      return statusMatch && materialMatch;
    })
  ), [batches, statusFilter, materialFilter]);

  const totals = useMemo(() => ({
    total: batches.length,
    active: batches.filter((b) => !['minted', 'cosigned', 'mint_pending', 'mint_failed'].includes(b.apiStatus)).length,
    ready: batches.filter((b) => b.apiStatus === 'minted').length,
  }), [batches]);

  const hasActiveFilters = statusFilter !== 'all' || materialFilter !== 'all';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => { void load('refresh'); }}
            tintColor={c.accent}
          />
        )}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: c.foreground }]}>Batch History</Text>
            <Text style={[styles.subtitle, { color: c.textMuted }]}>
              Track every submission from pending to minted asset.
            </Text>
          </View>
        </View>

        {isLoading ? <HistoryLoadingSkeleton /> : error ? (
          <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: c.error + '12', borderColor: c.error + '20' }]}>
              <Ionicons name="alert-circle-outline" size={22} color={c.error} />
            </View>
            <View style={styles.emptyCopy}>
              <Text style={[styles.emptyTitle, { color: c.foreground }]}>Failed to load</Text>
              <Text style={[styles.emptyBody, { color: c.textMuted }]}>{error}</Text>
            </View>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: c.foreground }]}
              onPress={() => { void load('initial'); }}
              activeOpacity={0.85}
            >
              <Text style={[styles.emptyBtnLabel, { color: c.background }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Metrics */}
            <View style={styles.metricsRow}>
              <View style={[styles.metricCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.metricValue, { color: c.foreground }]}>{totals.total}</Text>
                <Text style={[styles.metricLabel, { color: c.textMuted }]}>All Batches</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.metricValue, { color: c.foreground }]}>{totals.active}</Text>
                <Text style={[styles.metricLabel, { color: c.textMuted }]}>In Progress</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.metricValue, { color: c.accent }]}>{totals.ready}</Text>
                <Text style={[styles.metricLabel, { color: c.textMuted }]}>Asset Ready</Text>
              </View>
            </View>

            {/* Filters */}
            <View style={styles.filterSection}>
              <View style={styles.filterRow}>
                <Text style={[styles.filterLabel, { color: c.foreground }]}>Status</Text>
                {statusFilter !== 'all' && (
                  <TouchableOpacity onPress={() => setStatusFilter('all')} activeOpacity={0.7}>
                    <Text style={[styles.filterClear, { color: c.accent }]}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {STATUS_FILTERS.map(({ key, label }) => (
                  <Chip key={key} label={label} selected={statusFilter === key} onPress={() => setStatusFilter(key)} />
                ))}
              </ScrollView>

              <View style={[styles.filterRow, { marginTop: 6 }]}>
                <Text style={[styles.filterLabel, { color: c.foreground }]}>Material</Text>
                {materialFilter !== 'all' && (
                  <TouchableOpacity onPress={() => setMaterialFilter('all')} activeOpacity={0.7}>
                    <Text style={[styles.filterClear, { color: c.accent }]}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {MATERIAL_FILTERS.map((m) => (
                  <Chip key={m} label={m === 'all' ? 'All' : m} selected={materialFilter === m} onPress={() => setMaterialFilter(m)} />
                ))}
              </ScrollView>
            </View>

            {/* List header */}
            <View style={styles.listHeader}>
              <Text style={[styles.listCount, { color: c.foreground }]}>
                {filteredBatches.length} batch{filteredBatches.length !== 1 ? 'es' : ''}
                {hasActiveFilters ? <Text style={[styles.listFiltered, { color: c.textMuted }]}> · filtered</Text> : null}
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity onPress={() => { setStatusFilter('all'); setMaterialFilter('all'); }} activeOpacity={0.7}>
                  <Text style={[styles.filterClear, { color: c.accent }]}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Batch list */}
            {filteredBatches.length > 0 ? (
              <View style={styles.list}>
                {filteredBatches.map((b) => (
                  <View key={b.batchId} style={styles.batchWrap}>
                    <Text style={[styles.batchDate, { color: c.textFaint }]}>
                      {formatDate(b.summary.capturedAt)}
                    </Text>
                    <BatchCard
                      batch={b.summary}
                      onPress={() => router.push(`/batch/${b.batchId}` as never)}
                    />
                    {b.apiStatus === 'cosigning' && (
                      <TouchableOpacity
                        style={[styles.approveBtn, { backgroundColor: '#8b5cf6' }]}
                        onPress={() => router.push(`/batch/approve-cosign?id=${b.batchId}` as never)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="checkmark-circle-outline" size={15} color="#fff" />
                        <Text style={styles.approveBtnText}>Approve Co-sign</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            ) : batches.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={[styles.emptyIconWrap, { backgroundColor: c.accent + '15', borderColor: c.accent + '25' }]}>
                  <Ionicons name="layers-outline" size={22} color={c.accent} />
                </View>
                <View style={styles.emptyCopy}>
                  <Text style={[styles.emptyTitle, { color: c.foreground }]}>No batches yet</Text>
                  <Text style={[styles.emptyBody, { color: c.textMuted }]}>
                    Register your first plastic batch to start building your collection history.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.emptyBtn, { backgroundColor: c.foreground }]}
                  onPress={() => router.push('/batch/new/photo' as never)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={15} color={c.background} />
                  <Text style={[styles.emptyBtnLabel, { color: c.background }]}>Register First Batch</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={[styles.emptyIconWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <Ionicons name="filter-outline" size={22} color={c.textMuted} />
                </View>
                <View style={styles.emptyCopy}>
                  <Text style={[styles.emptyTitle, { color: c.foreground }]}>No matches</Text>
                  <Text style={[styles.emptyBody, { color: c.textMuted }]}>
                    No batches match the selected filters. Try adjusting status or material type.
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.emptyBtn, { borderWidth: 1, borderColor: c.border }]}
                  onPress={() => { setStatusFilter('all'); setMaterialFilter('all'); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.emptyBtnLabel, { color: c.foreground }]}>Clear Filters</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 18, paddingBottom: 40 },

  header: { gap: 4 },
  headerText: { gap: 5 },
  title: { fontSize: FontSize['2xl'], fontFamily: Font.bold, lineHeight: 28 },
  subtitle: { fontSize: FontSize.md, fontFamily: Font.regular, lineHeight: 22 },

  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, borderWidth: 1, borderRadius: 18, padding: 14, gap: 5 },
  metricValue: { fontSize: FontSize['2xl'], fontFamily: Font.bold },
  metricLabel: { fontSize: FontSize.xs, fontFamily: Font.regular },

  filterSection: { gap: 10 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  filterClear: { fontSize: FontSize.sm, fontFamily: Font.semiBold },
  chipRow: { gap: 8, paddingRight: 4 },
  chipRowStatic: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  chipLabel: { fontSize: FontSize.sm, fontFamily: Font.semiBold },

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listCount: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  listFiltered: { fontSize: FontSize.md, fontFamily: Font.regular },

  list: { gap: 12 },
  batchWrap: { gap: 6 },
  batchDate: {
    fontSize: FontSize.xs,
    fontFamily: Font.medium,
    paddingHorizontal: 4,
  },
  approveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 40, borderRadius: 12, gap: 7,
  },
  approveBtnText: { fontFamily: Font.semiBold, fontSize: FontSize.sm, color: '#fff' },

  emptyCard: {
    borderWidth: 1, borderRadius: 18, padding: 24, gap: 14,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 48, height: 48, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyCopy: { gap: 5, alignItems: 'center' },
  emptyTitle: { fontSize: FontSize.lg, fontFamily: Font.bold, textAlign: 'center' },
  emptyBody: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20, maxWidth: 260, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
  },
  emptyBtnLabel: { fontFamily: Font.semiBold, fontSize: FontSize.sm },

  skeletonList: { gap: 12 },
  skeletonCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  skeletonCardTop: { flexDirection: 'row', justifyContent: 'space-between' },
});
