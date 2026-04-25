import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BatchSummary } from '@/types';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { BatchCard } from '@/src/shared/ui/BatchCard';

interface LatestBatchesProps {
  batches: readonly BatchSummary[];
  isLoading?: boolean;
}

function BatchSkeleton() {
  const c = useThemeColors();
  return (
    <View style={[styles.skeletonCard, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[styles.skeletonBadge, { backgroundColor: c.border }]} />
      <View style={styles.skeletonRight}>
        <View style={[styles.skeletonLine, { backgroundColor: c.border, width: '40%' }]} />
        <View style={[styles.skeletonLine, { backgroundColor: c.border, width: '70%', height: 10 }]} />
      </View>
    </View>
  );
}

export function LatestBatches({ batches, isLoading = false }: LatestBatchesProps) {
  const router  = useRouter();
  const c       = useThemeColors();
  const visible = batches.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>Recent Batches</Text>
        {!isLoading && (
          <TouchableOpacity
            style={[styles.seeAllBtn, { backgroundColor: `${c.accent}18`, borderColor: `${c.accent}30`, borderWidth: 1 }]}
            onPress={() => router.push('/(supplier-tabs)/history')}
          >
            <Text style={[styles.seeAllText, { color: c.accent }]}>See all</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <>
          <BatchSkeleton />
          <BatchSkeleton />
          <BatchSkeleton />
        </>
      ) : visible.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={[styles.emptyIconWrap, { backgroundColor: c.accent + '15', borderColor: c.accent + '25' }]}>
            <Ionicons name="layers-outline" size={28} color={c.accent} />
          </View>
          <View style={styles.emptyCopy}>
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>No batches yet</Text>
            <Text style={[styles.emptyHint, { color: c.textMuted }]}>
              Register your first plastic batch to start tracking contributions and earning digital assets.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.emptyBtn, { backgroundColor: c.foreground }]}
            onPress={() => router.push('/batch/new/photo' as never)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={16} color={c.background} />
            <Text style={[styles.emptyBtnLabel, { color: c.background }]}>Register First Batch</Text>
          </TouchableOpacity>
        </View>

      ) : (
        visible.map((batch) => (
          <BatchCard
            key={batch.id}
            batch={batch}
            onPress={() => router.push(`/batch/${batch.id}` as never)}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: Font.bold,
  },
  seeAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
  },
  seeAllText: {
    fontSize: FontSize.sm,
    fontFamily: Font.semiBold,
  },
  empty: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    gap: 16,
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCopy: {
    gap: 6,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontFamily: Font.bold,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 20,
    maxWidth: 260,
    textAlign: 'center',
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnLabel: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  skeletonBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  skeletonRight: {
    flex: 1,
    gap: 8,
  },
  skeletonLine: {
    height: 13,
    borderRadius: 6,
  },
});
