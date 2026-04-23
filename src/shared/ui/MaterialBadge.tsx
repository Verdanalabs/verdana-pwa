import { StyleSheet, Text, View } from 'react-native';
import { MaterialType } from '@/types';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useTheme } from '@/src/shared/theme/theme-context';

const DARK: Record<MaterialType, { bg: string; text: string }> = {
  PET:   { bg: '#1a2e0a', text: '#b5f23d' },
  HDPE:  { bg: '#0a2a1e', text: '#34d399' },
  LDPE:  { bg: '#0a2828', text: '#2dd4bf' },
  PP:    { bg: '#162a10', text: '#86efac' },
  PS:    { bg: '#1c2a0a', text: '#a3e635' },
  PVC:   { bg: '#1a280a', text: '#84cc16' },
  OTHER: { bg: '#1a2a1a', text: '#6b9e70' },
  MIX:   { bg: '#1a1a2e', text: '#a78bfa' },
};

const LIGHT: Record<MaterialType, { bg: string; text: string }> = {
  PET:   { bg: '#ecfccb', text: '#3f6212' },
  HDPE:  { bg: '#d1fae5', text: '#065f46' },
  LDPE:  { bg: '#ccfbf1', text: '#134e4a' },
  PP:    { bg: '#dcfce7', text: '#14532d' },
  PS:    { bg: '#f7fee7', text: '#3a5c12' },
  PVC:   { bg: '#ecfccb', text: '#4d7c0f' },
  OTHER: { bg: '#f0fdf4', text: '#4b7a4b' },
  MIX:   { bg: '#ede9fe', text: '#5b21b6' },
};

interface MaterialBadgeProps {
  material: MaterialType;
}

export function MaterialBadge({ material }: MaterialBadgeProps) {
  const { isDark } = useTheme();
  const { bg, text } = (isDark ? DARK : LIGHT)[material];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{material}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: FontSize.xs,
    fontFamily: Font.bold,
    letterSpacing: 0.4,
  },
});
