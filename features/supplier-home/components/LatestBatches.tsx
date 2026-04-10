import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BatchSummary } from '@/types';
import { Font, FontSize } from '@/constants/typography';
import { useThemeColors } from '@/store/theme-context';
import { BatchCard } from '@/components/ui/BatchCard';

interface LatestBatchesProps {
  batches: BatchSummary[];
}

export function LatestBatches({ batches }: LatestBatchesProps) {
  const router  = useRouter();
  const c       = useThemeColors();
  const visible = batches.slice(0, 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: c.foreground }]}>Recent Batches</Text>
        <TouchableOpacity
          style={[styles.seeAllBtn, { backgroundColor: `${c.accent}18`, borderColor: `${c.accent}30`, borderWidth: 1 }]}
          onPress={() => router.push('/(supplier-tabs)/history')}
        >
          <Text style={[styles.seeAllText, { color: c.accent }]}>See all</Text>
        </TouchableOpacity>
      </View>

      {visible.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}>
          <Text style={styles.emptyEmoji}>📦</Text>
          <Text style={[styles.emptyTitle, { color: c.foreground }]}>No batches yet</Text>
          <Text style={[styles.emptyHint, { color: c.textMuted }]}>
            Tap "Register" to get started.
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
});
