import { StyleSheet, View } from 'react-native';
import { useThemeColors } from '@/src/shared/theme/theme-context';

export function SkeletonBox({
  width,
  height,
  radius = 10,
}: {
  width: number | string;
  height: number;
  radius?: number;
}) {
  const c = useThemeColors();

  return (
    <View
      style={[
        styles.box,
        {
          width: width as never,
          height,
          borderRadius: radius,
          backgroundColor: c.border,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
  },
});
