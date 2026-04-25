import { StyleSheet, Text, View, Image } from 'react-native';
import { appVariant } from '@/src/shared/config/app-variant';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';

const COLLECTOR_STEPS = [
  { num: '1', text: 'Open this link on your phone using Chrome or Safari.' },
  { num: '2', text: 'Tap "Add to Home Screen" so it works like a regular app.' },
  { num: '3', text: 'Sign in and start registering your batches.' },
];

const PVP_STEPS = [
  { num: '1', text: 'Open this link on your phone using Chrome or Safari.' },
  { num: '2', text: 'Add it to your Home Screen for faster operator access.' },
  { num: '3', text: 'Sign in and continue with your PVP dashboard and scan flow.' },
];

export default function DesktopBlockedScreen() {
  const c = useThemeColors();
  const isPvp = appVariant === 'pvp';
  const steps = isPvp ? PVP_STEPS : COLLECTOR_STEPS;

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <View style={styles.shell}>

        {/* ── Left column ─────────────────────────────────────────── */}
        <View style={styles.left}>
          {/* Logo */}
          <View style={styles.logoRow}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.brand, { color: c.foreground }]}>VERDANA PROTOCOL</Text>
          </View>

          {/* Heading */}
          <View style={styles.headingBlock}>
            <View style={[styles.pill, { backgroundColor: `${c.accent}20`, borderColor: `${c.accent}30` }]}>
              <View style={[styles.pillDot, { backgroundColor: c.accent }]} />
              <Text style={[styles.pillText, { color: c.accent }]}>Hey there 👋</Text>
            </View>
            <Text style={[styles.title, { color: c.foreground }]}>
              Looks like you're{'\n'}on a desktop.
            </Text>
            <Text style={[styles.subtitle, { color: c.textMuted }]}>
              No worries! Verdana is built for the field — grab your phone and open this same link there. It only takes a few seconds to get started.
            </Text>
          </View>

          {/* Steps */}
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.cardHeading, { color: c.foreground }]}>Here's what to do</Text>
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            {steps.map((step) => (
              <View key={step.num} style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: `${c.accent}15`, borderColor: `${c.accent}25` }]}>
                  <Text style={[styles.stepNumText, { color: c.accent }]}>{step.num}</Text>
                </View>
                <Text style={[styles.stepText, { color: c.textSecondary }]}>{step.text}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.footer, { color: c.textFaint }]}>verdanaprotocol.com</Text>
        </View>

        {/* ── Right column — mockup ────────────────────────────────── */}
        <View style={styles.right}>
          <View style={[styles.mockupFrame, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Image
              source={require('@/assets/image-home.png')}
              style={styles.mockupImg}
              resizeMode="cover"
            />
          </View>
          <View style={[styles.mockupLabel, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={[styles.mockupDot, { backgroundColor: c.accent }]} />
            <Text style={[styles.mockupLabelText, { color: c.textMuted }]}>
              {isPvp ? 'PVP operator app' : 'Supplier home screen'}
            </Text>
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  shell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 60,
    paddingVertical: 48,
    gap: 64,
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
  },

  // ── Left ──
  left: {
    flex: 1,
    gap: 28,
    maxWidth: 420,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: { width: 28, height: 28 },
  brand: {
    fontFamily: Font.bold,
    fontSize: FontSize.xs,
    letterSpacing: 1.5,
  },
  headingBlock: { gap: 14 },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillDot: { width: 6, height: 6, borderRadius: 99 },
  pillText: { fontFamily: Font.semiBold, fontSize: FontSize.sm },
  title: {
    fontFamily: Font.bold,
    fontSize: 38,
    lineHeight: 46,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: Font.regular,
    fontSize: FontSize.md,
    lineHeight: 26,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  cardHeading: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
  },
  divider: { height: 1 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumText: { fontFamily: Font.bold, fontSize: FontSize.xs },
  stepText: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 22,
    paddingTop: 3,
  },
  footer: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    letterSpacing: 0.4,
  },

  // ── Right ──
  right: {
    flex: 1,
    maxWidth: 340,
    alignItems: 'center',
    gap: 14,
  },
  mockupFrame: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    height: 480,
    position: 'relative',
  },
  mockupImg: {
    width: '100%',
    height: '100%',
  },
  mockupLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  mockupDot: { width: 6, height: 6, borderRadius: 99 },
  mockupLabelText: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
  },
});
