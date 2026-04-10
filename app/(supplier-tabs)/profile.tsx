import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/constants/typography';
import { useTheme, useThemeColors } from '@/store/theme-context';

export default function ProfileRoute() {
  const c = useThemeColors();
  const { isDark, toggle } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.foreground }]}>Profile</Text>
      </View>

      {/* Settings section */}
      <View style={styles.body}>
        <Text style={[styles.sectionLabel, { color: c.textFaint }]}>APPEARANCE</Text>

        <TouchableOpacity
          style={[styles.row, { backgroundColor: c.surface, borderColor: c.border }]}
          onPress={toggle}
          activeOpacity={0.7}
        >
          <View style={[styles.rowIcon, { backgroundColor: isDark ? 'rgba(181,242,61,0.12)' : 'rgba(150,204,46,0.12)' }]}>
            <Ionicons
              name={isDark ? 'moon' : 'sunny'}
              size={18}
              color={c.accent}
            />
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.rowLabel, { color: c.foreground }]}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </Text>
            <Text style={[styles.rowHint, { color: c.textMuted }]}>
              Tap to switch to {isDark ? 'light' : 'dark'} mode
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
        </TouchableOpacity>
      </View>

      <View style={styles.comingSoon}>
        <Text style={[styles.hint, { color: c.textFaint }]}>More settings coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FontSize.xl,
    fontFamily: Font.bold,
  },
  body: {
    padding: 20,
    gap: 8,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontFamily: Font.semiBold,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: FontSize.md,
    fontFamily: Font.semiBold,
  },
  rowHint: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    marginTop: 1,
  },
  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  hint: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
  },
});
