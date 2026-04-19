import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';

interface PrimaryButtonProps {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'filled' | 'outline' | 'ghost';
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'filled',
}: PrimaryButtonProps) {
  const c = useThemeColors();
  const isDisabled = disabled || loading;

  const bg =
    variant === 'filled' ? c.accent
    : variant === 'ghost'  ? `${c.accent}22`
    : 'transparent';

  const border = variant === 'outline' ? c.accent : undefined;
  const textColor = variant === 'filled' ? c.accentContrast : c.accent;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: bg, borderColor: border, borderWidth: variant === 'outline' ? 1.5 : 0 },
        isDisabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  disabled: { opacity: 0.45 },
  label: {
    fontSize: FontSize.lg,
    fontFamily: Font.semiBold,
  },
});
