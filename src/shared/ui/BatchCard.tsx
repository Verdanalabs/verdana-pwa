import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BatchSummary } from '@/types';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { StatusBadge } from './StatusBadge';

interface BatchCardProps {
  batch: BatchSummary;
  onPress?: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function BatchCard({ batch, onPress }: BatchCardProps) {
  const c = useThemeColors();
  const title = `${batch.materialType} · ${batch.estimatedWeightKg} kg`;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: c.surface, shadowColor: c.shadowColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.accentBar, { backgroundColor: c.accent }]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.leftCol}>
            <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
          </View>
          <StatusBadge status={batch.status} size="sm" />
        </View>

        <View style={styles.metaRow}>
          {!!batch.pvpName && (
            <>
              <Text style={[styles.meta, { color: c.textMuted }]}>{batch.pvpName}</Text>
              <View style={[styles.dot, { backgroundColor: c.textFaint }]} />
            </>
          )}
          <Text style={[styles.meta, { color: c.textMuted }]}>{formatDate(batch.capturedAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 10,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  accentBar: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftCol: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: FontSize.md,
    fontFamily: Font.bold,
  },
  shortId: {
    fontSize: FontSize.xs,
    fontFamily: Font.regular,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 99,
  },
});
