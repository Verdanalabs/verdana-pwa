import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/store/theme-context';
import { Font, FontSize } from '@/constants/typography';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function DesktopBlockedScreen() {
  const c = useThemeColors();

  return (
    <ThemedView style={styles.screen}>
      <LinearGradient
        colors={[c.heroGradient[0], c.background, c.backgroundSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      <View style={styles.shell}>
        <View style={[styles.badge, { backgroundColor: c.accent, borderColor: c.ctaBorder }]}>
          <ThemedText style={[styles.badgeText, { color: c.accentContrast }]}>Mobile Only</ThemedText>
        </View>

        <ThemedText style={[styles.title, { color: c.foreground }]}>
          Open Verdana from your phone.
        </ThemedText>

        <ThemedText style={[styles.description, { color: c.textSecondary }]}>
          Supplier and Drop-off Point flows are only available on mobile browsers or installed PWA mode.
        </ThemedText>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <ThemedText style={[styles.cardTitle, { color: c.foreground }]}>What to do next</ThemedText>
          <ThemedText style={[styles.cardItem, { color: c.textSecondary }]}>
            Open this link from your mobile phone.
          </ThemedText>
          <ThemedText style={[styles.cardItem, { color: c.textSecondary }]}>
            Install the app to your home screen for the best field workflow.
          </ThemedText>
          <ThemedText style={[styles.cardItem, { color: c.textSecondary }]}>
            Use desktop only for dashboard surfaces that are built separately.
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  shell: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 20,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.base,
    lineHeight: 18,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: FontSize['4xl'],
    lineHeight: 42,
  },
  description: {
    fontFamily: Font.regular,
    fontSize: FontSize.xl,
    lineHeight: 28,
    maxWidth: 520,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  cardTitle: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.lg,
    lineHeight: 24,
  },
  cardItem: {
    fontFamily: Font.regular,
    fontSize: FontSize.md,
    lineHeight: 24,
  },
});
