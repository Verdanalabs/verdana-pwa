import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { useInventoryStatusPalette } from './InventoryStatusBadge';
import type { InventoryStatus } from '@/src/features/inventory/services/inventory-api';

export type StatusFilterKey = 'All' | InventoryStatus;

interface InventoryFilterBarProps {
  materials: readonly string[];
  material: string;
  onMaterialChange: (value: string) => void;
  statuses: { key: StatusFilterKey; label: string }[];
  status: StatusFilterKey;
  onStatusChange: (value: StatusFilterKey) => void;
  resultCount: number;
  totalCount: number;
  onClear: () => void;
}

function Chip({
  label,
  selected,
  dotColor,
  onPress,
}: {
  label: string;
  selected: boolean;
  dotColor?: string;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { backgroundColor: selected ? c.accent : c.surface, borderColor: selected ? c.accent : c.border },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {dotColor ? (
        <View style={[styles.dot, { backgroundColor: selected ? c.accentContrast : dotColor }]} />
      ) : null}
      <Text style={[styles.chipText, { color: selected ? c.accentContrast : c.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function InventoryFilterBar({
  materials,
  material,
  onMaterialChange,
  statuses,
  status,
  onStatusChange,
  resultCount,
  totalCount,
  onClear,
}: InventoryFilterBarProps) {
  const c = useThemeColors();
  const palette = useInventoryStatusPalette();
  const isFiltered = material !== 'All' || status !== 'All';

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.group}>
        <Text style={[styles.label, { color: c.textMuted }]}>MATERIAL</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {materials.map((m) => (
            <Chip key={m} label={m} selected={material === m} onPress={() => onMaterialChange(m)} />
          ))}
        </ScrollView>
      </View>

      <View style={[styles.divider, { backgroundColor: c.border }]} />

      <View style={styles.group}>
        <Text style={[styles.label, { color: c.textMuted }]}>STATUS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {statuses.map((s) => (
            <Chip
              key={s.key}
              label={s.label}
              selected={status === s.key}
              dotColor={s.key === 'All' ? undefined : palette[s.key]?.fg}
              onPress={() => onStatusChange(s.key)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={[styles.footer, { borderTopColor: c.border }]}>
        <Text style={[styles.count, { color: c.textSecondary }]}>
          {isFiltered ? `${resultCount} of ${totalCount}` : `${totalCount}`}
          <Text style={{ color: c.textMuted }}>{totalCount === 1 ? ' item' : ' items'}</Text>
        </Text>
        {isFiltered ? (
          <TouchableOpacity onPress={onClear} style={styles.clearBtn} activeOpacity={0.7} hitSlop={8}>
            <Ionicons name="close-circle" size={15} color={c.accentInk} />
            <Text style={[styles.clearText, { color: c.accentInk }]}>Clear filters</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, paddingVertical: 12, gap: 12 },
  group: { gap: 8 },
  label: {
    fontSize: FontSize.xs,
    fontFamily: Font.semiBold,
    letterSpacing: 0.8,
    paddingHorizontal: 14,
  },
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: { width: 7, height: 7, borderRadius: 99 },
  chipText: { fontSize: FontSize.sm, fontFamily: Font.medium },
  divider: { height: 1, marginHorizontal: 14 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 11,
    paddingHorizontal: 14,
  },
  count: { fontSize: FontSize.sm, fontFamily: Font.semiBold },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  clearText: { fontSize: FontSize.sm, fontFamily: Font.medium },
});
