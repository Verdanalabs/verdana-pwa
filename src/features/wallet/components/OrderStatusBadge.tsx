import { StyleSheet, Text, View } from 'react-native';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import type { Tone } from '@/src/shared/theme/tokens';
import type { OrderStatus } from '@/types';

const LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Statuses map to shared tones rather than carrying their own palette.
const TONE: Record<OrderStatus, Tone> = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'accent',
  cancelled: 'danger',
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
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
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, alignSelf: 'flex-start' },
  sm: { paddingHorizontal: 8, paddingVertical: 3 },
  label: { fontSize: FontSize.sm, fontFamily: Font.semiBold },
  labelSm: { fontSize: FontSize.xs },
});
