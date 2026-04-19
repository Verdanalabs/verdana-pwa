import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BatchCard } from '@/src/shared/ui/BatchCard';
import { BATCH_STATUS_LABEL } from '@/src/shared/lib/batch-status';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { getMockBatches, getMockBatchSummaries } from '@/src/shared/services/mock/batch-data';
import type { BatchStatus, MaterialType } from '@/types';

type StatusFilter = 'all' | BatchStatus;
type MaterialFilter = 'all' | MaterialType;

const STATUS_FILTERS: StatusFilter[] = ['all', 'transit', 'pending_validation', 'minted'];
const MATERIAL_FILTERS: MaterialFilter[] = ['all', 'PET', 'HDPE', 'PP'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
  });
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: selected ? c.accent : c.surface,
          borderColor: selected ? c.accent : c.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.chipLabel,
          { color: selected ? c.accentContrast : c.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function HistoryRoute() {
  const c = useThemeColors();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [materialFilter, setMaterialFilter] = useState<MaterialFilter>('all');
  const batches = getMockBatches();
  const batchSummaries = getMockBatchSummaries();

  const filteredBatches = useMemo(() => (
    batchSummaries.filter((batch) => {
      const fullBatch = batches.find((item) => item.id === batch.id);
      if (!fullBatch) return false;

      const statusMatch = statusFilter === 'all' || batch.status === statusFilter;
      const materialMatch = materialFilter === 'all' || batch.materialType === materialFilter;
      return statusMatch && materialMatch;
    })
  ), [batchSummaries, batches, materialFilter, statusFilter]);

  const totals = useMemo(() => ({
    total: batches.length,
    active: batches.filter((batch) =>
      ['submitted', 'transit', 'pending_validation', 'verified', 'minting'].includes(batch.status)
    ).length,
    ready: batches.filter((batch) => batch.status === 'minted').length,
  }), [batches]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: c.foreground }]}>Batch History</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              Check each batch and follow the latest status without guessing.
            </Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="time-outline" size={18} color={c.accent} />
          </View>
        </View>

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
            {STATUS_FILTERS.map((status) => (
              <Chip
                key={status}
                label={status === 'all' ? 'All' : BATCH_STATUS_LABEL[status]}
                selected={statusFilter === status}
                onPress={() => setStatusFilter(status)}
              />
            ))}
          </ScrollView>

          <Text style={[styles.filterTitle, { color: c.foreground }]}>Material</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {MATERIAL_FILTERS.map((material) => (
              <Chip
                key={material}
                label={material === 'all' ? 'All' : material}
                selected={materialFilter === material}
                onPress={() => setMaterialFilter(material)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: c.foreground }]}>
            {filteredBatches.length} batch{filteredBatches.length === 1 ? '' : 'es'}
          </Text>
          <Text style={[styles.listHint, { color: c.textMuted }]}>
            Latest update first
          </Text>
        </View>

        {filteredBatches.length > 0 ? (
          <View>
            {filteredBatches.map((batch) => (
              <View key={batch.id} style={styles.batchWrap}>
                <BatchCard batch={batch} onPress={() => router.push(`/batch/${batch.id}` as never)} />
                <Text style={[styles.batchDate, { color: c.textFaint }]}>
                  Captured {formatDate(batch.capturedAt)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="filter-outline" size={20} color={c.accent} />
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>No batches match this filter.</Text>
            <Text style={[styles.emptyText, { color: c.textMuted }]}>
              Try another status or material to see your recorded batches.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontFamily: Font.bold,
    lineHeight: 28,
  },
  subtitle: {
    marginTop: 6,
    fontSize: FontSize.md,
    fontFamily: Font.regular,
    lineHeight: 22,
    maxWidth: 280,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  metricValue: {
    fontSize: FontSize['2xl'],
    fontFamily: Font.bold,
  },
  metricLabel: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
  },
  filterSection: {
    gap: 10,
  },
  filterTitle: {
    fontSize: FontSize.md,
    fontFamily: Font.semiBold,
  },
  chipRow: {
    gap: 10,
    paddingRight: 12,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipLabel: {
    fontSize: FontSize.sm,
    fontFamily: Font.semiBold,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  listTitle: {
    fontSize: FontSize.lg,
    fontFamily: Font.bold,
  },
  listHint: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
  },
  batchWrap: {
    marginBottom: 6,
  },
  batchDate: {
    marginTop: -2,
    marginBottom: 10,
    marginLeft: 12,
    fontSize: FontSize.xs,
    fontFamily: Font.regular,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    alignItems: 'flex-start',
    gap: 10,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontFamily: Font.semiBold,
  },
  emptyText: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 20,
    maxWidth: 280,
  },
});
