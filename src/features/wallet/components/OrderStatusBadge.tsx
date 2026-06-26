import { StyleSheet, Text, View } from 'react-native';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useTheme } from '@/src/shared/theme/theme-context';
import type { OrderStatus } from '@/types';

const LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const DARK: Record<OrderStatus, { bg: string; fg: string }> = {
  pending: { bg: '#2a1f08', fg: '#fbbf24' },
  confirmed: { bg: '#0c1f3a', fg: '#60a5fa' },
  completed: { bg: '#b5f23d', fg: '#070e07' },
  cancelled: { bg: '#2a0808', fg: '#f87171' },
};

const LIGHT: Record<OrderStatus, { bg: string; fg: string }> = {
  pending: { bg: '#fef3c7', fg: '#92400e' },
  confirmed: { bg: '#dbeafe', fg: '#1d4ed8' },
  completed: { bg: '#96cc2e', fg: '#091406' },
  cancelled: { bg: '#fee2e2', fg: '#991b1b' },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export function OrderStatusBadge({ status, size = 'md' }: OrderStatusBadgeProps) {
  const { isDark } = useTheme();
  const palette = isDark ? DARK : LIGHT;
  const { bg, fg } = palette[status] ?? palette.pending;

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
