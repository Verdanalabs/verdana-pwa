import { StyleSheet, Text, View } from 'react-native';
import { BatchStatus } from '@/types';
import { Font, FontSize } from '@/constants/typography';
import { BATCH_STATUS_LABEL } from '@/constants/batch-status';
import { useThemeColors } from '@/store/theme-context';

interface StatusBadgeProps {
  status: BatchStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const c = useThemeColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.statusBg[status] },
        size === 'sm' && styles.sm,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: c.statusFg[status], fontFamily: Font.semiBold },
          size === 'sm' && styles.labelSm,
        ]}
      >
        {BATCH_STATUS_LABEL[status]}
      </Text>
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
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: FontSize.sm,
  },
  labelSm: {
    fontSize: FontSize.xs,
  },
});
