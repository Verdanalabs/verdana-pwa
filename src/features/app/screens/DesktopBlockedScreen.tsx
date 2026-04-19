import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';

export default function DesktopBlockedScreen() {
  const c = useThemeColors();

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}> 
      <LinearGradient
        colors={[c.heroGradient[0], c.background, c.backgroundSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      <View style={styles.shell}>
        <View style={[styles.badge, { backgroundColor: c.accent, borderColor: c.ctaBorder }]}> 
          <Text style={[styles.badgeText, { color: c.accentContrast }]}>Mobile Only</Text>
        </View>

        <Text style={[styles.title, { color: c.foreground }]}>Open Verdana from your phone.</Text>

        <Text style={[styles.description, { color: c.textSecondary }]}> 
          Supplier and Drop-off Point flows are only available on mobile browsers or installed PWA mode.
        </Text>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}> 
          <Text style={[styles.cardTitle, { color: c.foreground }]}>What to do next</Text>
          <Text style={[styles.cardItem, { color: c.textSecondary }]}>Open this link from your mobile phone.</Text>
          <Text style={[styles.cardItem, { color: c.textSecondary }]}>Install the app to your home screen for the best field workflow.</Text>
          <Text style={[styles.cardItem, { color: c.textSecondary }]}>Use desktop only for dashboard surfaces that are built separately.</Text>
        </View>
      </View>
    </View>
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
