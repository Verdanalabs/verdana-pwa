import { StyleSheet, Text, View } from 'react-native';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import type { Tone } from '@/src/shared/theme/tokens';
import type { InventoryStatus } from '@/src/features/inventory/services/inventory-api';

const LABEL: Record<InventoryStatus, string> = {
  in_stock: 'In Stock',
  reserved: 'Reserved',
  sold: 'Sold',
  depleted: 'Depleted',
};

// Statuses map to shared tones rather than carrying their own palette.
const TONE: Record<InventoryStatus, Tone> = {
  in_stock: 'success',
  reserved: 'warning',
  sold: 'accent',
  depleted: 'danger',
};

export function useInventoryStatusPalette(): Record<InventoryStatus, { bg: string; fg: string }> {
  const c = useThemeColors();
  return Object.fromEntries(
    (Object.keys(TONE) as InventoryStatus[]).map((s) => [
      s,
      { bg: c.toneBg[TONE[s]], fg: c.toneFg[TONE[s]] },
    ])
  ) as Record<InventoryStatus, { bg: string; fg: string }>;
}

interface InventoryStatusBadgeProps {
  status: InventoryStatus;
  size?: 'sm' | 'md';
}

export function InventoryStatusBadge({ status, size = 'md' }: InventoryStatusBadgeProps) {
  const c = useThemeColors();
  const tone = TONE[status] ?? 'neutral';
  const bg = c.toneBg[tone];
  const fg = c.toneFg[tone];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, size === 'sm' && styles.sm]}>
      <Text style={[styles.label, { color: fg }, size === 'sm' && styles.labelSm]}>{LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    alignSelf: 'flex-start',
  },
  sm: { paddingHorizontal: 8, paddingVertical: 3 },
  label: { fontSize: FontSize.sm, fontFamily: Font.semiBold },
  labelSm: { fontSize: FontSize.xs },
});
