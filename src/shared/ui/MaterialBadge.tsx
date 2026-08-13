import { StyleSheet, Text, View } from 'react-native';
import { MaterialType } from '@/types';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';

interface MaterialBadgeProps {
  material: MaterialType;
}

export function MaterialBadge({ material }: MaterialBadgeProps) {
  const c = useThemeColors();
  const bg = c.materialBg[material] ?? c.materialBg.MIX;
  const text = c.materialFg[material] ?? c.materialFg.MIX;

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
