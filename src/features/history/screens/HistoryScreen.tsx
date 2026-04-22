import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
type MaterialFilter = 'all' | 'PET' | 'HDPE' | 'LDPE' | 'PP';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'accepted',  label: 'Accepted' },
  { key: 'cosigning', label: 'Needs Approval' },
  { key: 'cosigned',  label: 'Co-signed' },
  { key: 'minted',    label: 'Asset Ready' },
];

const MATERIAL_FILTERS: MaterialFilter[] = ['all', 'PET', 'HDPE', 'LDPE', 'PP'];

// Map API status → display BatchStatus (group mint_pending/mint_failed under cosigned)
function mapStatus(apiStatus: string): BatchStatus {
  switch (apiStatus) {
    case 'mint_pending':
    case 'mint_failed': return 'cosigned';
    default:            return apiStatus as BatchStatus;
  }
}

// Map API status → filter chip key
function uiStatusFilter(apiStatus: string): StatusFilter {
  switch (apiStatus) {
    case 'pending':      return 'pending';
    case 'accepted':     return 'accepted';
    case 'cosigning':    return 'cosigning';
    case 'cosigned':
    case 'mint_pending':
    case 'mint_failed':  return 'cosigned';
    case 'minted':       return 'minted';
    default:             return 'pending';
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
      pvpName: b.pvp_site_id ?? '-',
      capturedAt: b.created_at,
    },
    apiStatus: b.status,
    batchId: b.id,
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const c = useThemeColors();
  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: selected ? c.accent : c.surface, borderColor: selected ? c.accent : c.border }]}
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
        {[0, 1, 2].map((item) => (
          <View key={item} style={[styles.metricCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <SkeletonBox width="45%" height={30} radius={8} />
            <SkeletonBox width="70%" height={12} radius={6} />
          </View>
        ))}
      </View>

      <View style={styles.filterSection}>
        <SkeletonBox width={64} height={16} radius={6} />
        <View style={styles.chipRowStatic}>
          {[0, 1, 2, 3].map((item) => (
            <View key={item} style={[styles.chip, { backgroundColor: c.surface, borderColor: c.border }]}>
              <SkeletonBox width={56} height={12} radius={6} />
            </View>
          ))}
        </View>

        <SkeletonBox width={72} height={16} radius={6} />
        <View style={styles.chipRowStatic}>
          {[0, 1, 2, 3].map((item) => (
            <View key={item} style={[styles.chip, { backgroundColor: c.surface, borderColor: c.border }]}>
              <SkeletonBox width={48} height={12} radius={6} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.listHeader}>
        <SkeletonBox width={120} height={18} radius={6} />
        <SkeletonBox width={70} height={12} radius={6} />
      </View>

      <View style={styles.skeletonList}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={[styles.skeletonCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.skeletonCardTop}>
              <SkeletonBox width="28%" height={12} radius={6} />
              <SkeletonBox width="18%" height={10} radius={5} />
            </View>
            <SkeletonBox width="54%" height={18} radius={7} />
            <SkeletonBox width="72%" height={12} radius={6} />
            <View style={styles.skeletonCardBottom}>
              <SkeletonBox width="36%" height={12} radius={6} />
              <SkeletonBox width="22%" height={12} radius={6} />
            </View>
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const token = await getAccessToken();
        if (!token) throw new Error('Not authenticated');
        const data = await getBatches(token);
        if (!cancelled) setBatches(data.map(toRichBatch));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load batches');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [getAccessToken]);

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: c.foreground }]}>Batch History</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              Track every batch and follow its status from submission to asset creation.
            </Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="time-outline" size={18} color={c.accent} />
          </View>
        </View>

        {isLoading ? (
          <HistoryLoadingSkeleton />
        ) : error ? (
          <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="alert-circle-outline" size={20} color={c.error} />
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>Failed to load batches</Text>
            <Text style={[styles.emptyText, { color: c.textMuted }]}>{error}</Text>
          </View>
        ) : (
          <>
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
                <Text style={[styles.metricValue, { color: c.foreground }]}>{totals.ready}</Text>
                <Text style={[styles.metricLabel, { color: c.textMuted }]}>Asset Ready</Text>
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={[styles.filterTitle, { color: c.foreground }]}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {STATUS_FILTERS.map(({ key, label }) => (
                  <Chip key={key} label={label} selected={statusFilter === key} onPress={() => setStatusFilter(key)} />
                ))}
              </ScrollView>

              <Text style={[styles.filterTitle, { color: c.foreground }]}>Material</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {MATERIAL_FILTERS.map((m) => (
                  <Chip key={m} label={m === 'all' ? 'All' : m} selected={materialFilter === m} onPress={() => setMaterialFilter(m as MaterialFilter)} />
                ))}
              </ScrollView>
            </View>

            <View style={styles.listHeader}>
              <Text style={[styles.listTitle, { color: c.foreground }]}>
                {filteredBatches.length} batch{filteredBatches.length === 1 ? '' : 'es'}
              </Text>
              <Text style={[styles.listHint, { color: c.textMuted }]}>Latest first</Text>
            </View>

            {filteredBatches.length > 0 ? (
              <View>
                {filteredBatches.map((b) => (
                  <View key={b.batchId} style={styles.batchWrap}>
                    <BatchCard batch={b.summary} onPress={() => router.push(`/batch/${b.batchId}` as never)} />
                    {b.apiStatus === 'cosigning' && (
                      <TouchableOpacity
                        style={[styles.approveBtn, { backgroundColor: '#8b5cf6' }]}
                        onPress={() => router.push(`/batch/approve-cosign?id=${b.batchId}` as never)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                        <Text style={styles.approveBtnText}>Approve Co-sign</Text>
                      </TouchableOpacity>
                    )}
                    <Text style={[styles.batchDate, { color: c.textFaint }]}>
                      Submitted {formatDate(b.summary.capturedAt)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Ionicons name="filter-outline" size={20} color={c.accent} />
                <Text style={[styles.emptyTitle, { color: c.foreground }]}>No batches match this filter.</Text>
                <Text style={[styles.emptyText, { color: c.textMuted }]}>
                  Try a different status or material type.
                </Text>
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
  content: { padding: 20, gap: 20, paddingBottom: 36 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 },
  title: { fontSize: FontSize['2xl'], fontFamily: Font.bold, lineHeight: 28 },
  subtitle: { marginTop: 6, fontSize: FontSize.md, fontFamily: Font.regular, lineHeight: 22, maxWidth: 280 },
  headerIcon: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: { flex: 1, borderWidth: 1, borderRadius: 18, padding: 14, gap: 6 },
  metricValue: { fontSize: FontSize['2xl'], fontFamily: Font.bold },
  metricLabel: { fontSize: FontSize.sm, fontFamily: Font.regular },
  filterSection: { gap: 10 },
  filterTitle: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  chipRow: { gap: 10, paddingRight: 12 },
  chipRowStatic: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  chipLabel: { fontSize: FontSize.sm, fontFamily: Font.semiBold },
  centerState: { paddingVertical: 48, alignItems: 'center' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listTitle: { fontSize: FontSize.lg, fontFamily: Font.bold },
  listHint: { fontSize: FontSize.sm, fontFamily: Font.regular },
  skeletonList: { gap: 12 },
  skeletonCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  skeletonCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skeletonCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  batchWrap: { marginBottom: 6 },
  batchDate: { marginTop: -2, marginBottom: 10, marginLeft: 12, fontSize: FontSize.xs, fontFamily: Font.regular },
  approveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 40, borderRadius: 12, gap: 8, marginTop: 6, marginBottom: 4,
  },
  approveBtnText: { fontFamily: Font.semiBold, fontSize: FontSize.sm, color: '#fff' },
  emptyCard: { borderWidth: 1, borderRadius: 18, padding: 18, alignItems: 'flex-start', gap: 10 },
  emptyTitle: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  emptyText: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20, maxWidth: 280 },
});
