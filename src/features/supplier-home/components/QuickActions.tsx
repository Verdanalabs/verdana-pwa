import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';

interface ActionItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}

function ActionItem({ icon, label, onPress }: ActionItemProps) {
  const c = useThemeColors();

  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: c.surface, borderColor: c.border, shadowColor: c.shadowColor },
        ]}
      >
        <Ionicons name={icon} size={22} color={c.accent} />
      </View>
      <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function QuickActions() {
  const router = useRouter();
  const c      = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: c.foreground }]}>Quick Actions</Text>
      <View style={styles.row}>
        <ActionItem
          icon="add-circle"
          label="Register"
          onPress={() => router.push('/batch/new/photo' as never)}
        />
        <ActionItem
          icon="time-outline"
          label="History"
          onPress={() => router.push('/(supplier-tabs)/history')}
        />
        <ActionItem
          icon="storefront-outline"
          label="Market"
          onPress={() => router.push('/(supplier-tabs)/wallet')}
        />
        <ActionItem
          icon="stats-chart-outline"
          label="Analytics"
          onPress={() => router.push('/(supplier-tabs)/analytics')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: Font.bold,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 99,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: {
    fontSize: FontSize.xs,
    fontFamily: Font.medium,
    textAlign: 'center',
  },
});
