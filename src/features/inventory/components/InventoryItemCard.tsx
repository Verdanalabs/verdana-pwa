import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { MaterialBadge } from '@/src/shared/ui/MaterialBadge';
import { InventoryStatusBadge } from './InventoryStatusBadge';
import type { InventoryItem } from '@/src/features/inventory/services/inventory-api';

interface InventoryItemCardProps {
  item: InventoryItem;
  onPress?: () => void;
}

function formatKg(grams: number): string {
  return `${(grams / 1000).toFixed(1)} kg`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function InventoryItemCard({ item, onPress }: InventoryItemCardProps) {
  const c = useThemeColors();
  const material = item.material.toUpperCase();

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
            <Text style={[styles.title, { color: c.foreground }]}>
              {material} · {formatKg(item.weight_grams)}
            </Text>
            <View style={styles.badgeRow}>
              <MaterialBadge material={material as never} />
              {item.grade ? (
                <View style={[styles.gradePill, { borderColor: c.border }]}>
                  <Text style={[styles.gradeText, { color: c.textSecondary }]}>Grade {item.grade}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <InventoryStatusBadge status={item.status} size="sm" />
        </View>

        <Text style={[styles.meta, { color: c.textMuted }]}>Added {formatDate(item.created_at)}</Text>
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
  accentBar: { width: 4 },
  body: { flex: 1, padding: 14, gap: 8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  leftCol: { flex: 1, gap: 8 },
  title: { fontSize: FontSize.md, fontFamily: Font.bold },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gradePill: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  gradeText: { fontSize: FontSize.xs, fontFamily: Font.medium },
  meta: { fontSize: FontSize.sm, fontFamily: Font.regular },
});
