import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import type { Tone } from '@/src/shared/theme/tokens';

const TONE_ICON: Record<Tone, keyof typeof Ionicons.glyphMap> = {
  neutral: 'information-circle-outline',
  info: 'information-circle-outline',
  warning: 'warning-outline',
  success: 'checkmark-circle-outline',
  danger: 'alert-circle-outline',
  accent: 'leaf-outline',
};

export interface NoticeCardProps {
  tone: Tone;
  children: ReactNode;
  /** Overrides the tone's default icon. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Extra content below the message — a retry link, a detail list. */
  footer?: ReactNode;
}

/**
 * Inline notice: alert, warning, confirmation.
 *
 * Uses the `toneBg` / `toneFg` pair rather than a low-alpha tint of the raw
 * tone. A tone laid over a surface at 10% *lightens* the ground in dark mode,
 * and `#ff6b6b` on that ground measures 3.89:1 — under AA. The tone pairs are
 * designed together and clear AA on every surface, which the contrast gate
 * asserts.
 *
 * Always icon plus text: status is never signalled by colour alone.
 */
export function NoticeCard({ tone, children, icon, footer }: NoticeCardProps) {
  const c = useThemeColors();
  const bg = c.toneBg[tone];
  const fg = c.toneFg[tone];

  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: fg }]}>
      <Ionicons name={icon ?? TONE_ICON[tone]} size={16} color={fg} style={styles.icon} />
      <View style={styles.body}>
        {typeof children === 'string' ? (
          <Text style={[styles.text, { color: fg }]}>{children}</Text>
        ) : (
          children
        )}
        {footer}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 10,
    // The tone foreground doubles as the border at low opacity; a full-strength
    // 1px rule would ring the card too hard.
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 13,
    alignItems: 'flex-start',
  },
  icon: { marginTop: 1 },
  body: { flex: 1, gap: 4 },
  text: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
});
