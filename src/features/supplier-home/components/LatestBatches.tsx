import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
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
        <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={[styles.emptyTitle, { color: c.foreground }]}>No batches yet</Text>
          <Text style={[styles.emptyHint, { color: c.textMuted }]}>
            Tap &quot;Register&quot; to get started.
          </Text>
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
    alignItems: 'center',
    paddingVertical: 36,
    gap: 6,
    borderRadius: 16,
  },
  emptyEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontFamily: Font.semiBold,
  },
  emptyHint: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
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
