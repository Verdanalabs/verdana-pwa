import { StyleSheet, Text, View } from 'react-native';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useTheme } from '@/src/shared/theme/theme-context';
import type { InventoryStatus } from '@/src/features/inventory/services/inventory-api';

const LABEL: Record<InventoryStatus, string> = {
  in_stock: 'In Stock',
  reserved: 'Reserved',
  sold: 'Sold',
  depleted: 'Depleted',
};

const DARK: Record<InventoryStatus, { bg: string; fg: string }> = {
  in_stock: { bg: '#162a10', fg: '#b5f23d' },
  reserved: { bg: '#2a1f08', fg: '#fbbf24' },
  sold: { bg: '#b5f23d', fg: '#070e07' },
  depleted: { bg: '#2a0808', fg: '#f87171' },
};

const LIGHT: Record<InventoryStatus, { bg: string; fg: string }> = {
  in_stock: { bg: '#dcfce7', fg: '#166534' },
  reserved: { bg: '#fef3c7', fg: '#92400e' },
  sold: { bg: '#96cc2e', fg: '#091406' },
  depleted: { bg: '#fee2e2', fg: '#991b1b' },
};

export function useInventoryStatusPalette(): Record<InventoryStatus, { bg: string; fg: string }> {
  const { isDark } = useTheme();
  return isDark ? DARK : LIGHT;
}

interface InventoryStatusBadgeProps {
  status: InventoryStatus;
  size?: 'sm' | 'md';
}

export function InventoryStatusBadge({ status, size = 'md' }: InventoryStatusBadgeProps) {
  const { isDark } = useTheme();
  const palette = isDark ? DARK : LIGHT;
  const { bg, fg } = palette[status] ?? palette.in_stock;

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
