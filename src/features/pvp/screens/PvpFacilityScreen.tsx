import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useTheme, useThemeColors } from '@/src/shared/theme/theme-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { usePvpBatchFeed } from '@/src/features/pvp/hooks/usePvpBatchFeed';

function dicebearUrl(name: string) {
  return `https://api.dicebear.com/9.x/avataaars-neutral/png?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

function shortId(value?: string | null) {
  if (!value) return 'NO SITE';
  return value.slice(0, 8).toUpperCase();
}

function InfoRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  const c = useThemeColors();

  return (
    <View style={[styles.infoRow, { borderBottomColor: isLast ? 'transparent' : c.border }]}>
      <View style={[styles.infoIconWrap, { backgroundColor: c.backgroundSoft }]}>
        <Ionicons name={icon} size={16} color={c.textMuted} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={[styles.infoLabel, { color: c.textMuted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: c.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function PvpFacilityTab() {
  const c = useThemeColors();
  const { isDark, toggle } = useTheme();
  const { operator, activeSite, signOut } = usePvpAuth();
  const { batches } = usePvpBatchFeed();

  const operatorName = operator?.display_name ?? 'PVP Operator';
  const operatorEmail = operator?.email ?? 'No email available';
  const avatarUri = dicebearUrl(operatorName);

  const totalKg = batches.reduce((sum, batch) => {
    const grams = batch.actual_weight_grams ?? batch.estimated_weight_grams ?? 0;
    return sum + grams / 1000;
  }, 0);

  const awaitingSign = batches.filter((batch) => batch.status === 'cosigning').length;

  function handleSignOut() {
    signOut();
    router.replace('/(auth)/pvp-login' as never);
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: c.accent }]}>FACILITY</Text>
          <Text style={[styles.pageTitle, { color: c.foreground }]}>Station Settings</Text>
          <Text style={[styles.pageSub, { color: c.textMuted }]}>
            Review operator identity, site details, and local operating preferences.
          </Text>
        </View>

        <View style={[styles.heroCard, { borderColor: c.border }]}>
          <View style={[styles.heroGlow, { backgroundColor: c.heroGlowColor }]} />

          <View style={styles.heroTop}>
            <View style={[styles.avatarWrap, { borderColor: 'rgba(255,255,255,0.10)' }]}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
            </View>

            <View style={styles.heroCopy}>
              <Text style={styles.heroName}>{operatorName}</Text>
              <Text style={styles.heroMeta}>Physical Validation Point Operator</Text>
              <Text style={styles.heroHint}>{operatorEmail}</Text>
            </View>
          </View>

          <View style={styles.heroSiteRow}>
            <View>
              <Text style={styles.heroSiteLabel}>ACTIVE STATION</Text>
              <Text style={styles.heroSiteValue}>{activeSite?.name ?? 'No active station'}</Text>
            </View>

            <View style={styles.heroBadge}>
              <View style={styles.heroBadgeDot} />
              <Text style={styles.heroBadgeText}>ONLINE</Text>
            </View>
          </View>
        </View>

        <View style={[styles.metricsRow, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: c.accent }]}>{batches.length}</Text>
            <Text style={[styles.metricLabel, { color: c.textMuted }]}>Tracked batches</Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: c.border }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: c.accent }]}>{totalKg.toFixed(1)}</Text>
            <Text style={[styles.metricLabel, { color: c.textMuted }]}>Total kg</Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: c.border }]} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: c.accent }]}>{awaitingSign}</Text>
            <Text style={[styles.metricLabel, { color: c.textMuted }]}>Awaiting sign</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionCaption, { color: c.textFaint }]}>OPERATOR</Text>
          <View style={[styles.sectionCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <InfoRow icon="person-outline" label="Display name" value={operatorName} />
            <InfoRow icon="mail-outline" label="Email" value={operatorEmail} isLast />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionCaption, { color: c.textFaint }]}>SITE DETAILS</Text>
          <View style={[styles.sectionCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <InfoRow icon="business-outline" label="Station ID" value={shortId(activeSite?.id)} />
            <InfoRow icon="location-outline" label="Address" value={activeSite?.address ?? 'Address not available'} />
            <InfoRow
              icon="navigate-outline"
              label="Coordinates"
              value={activeSite ? `${activeSite.latitude.toFixed(5)}, ${activeSite.longitude.toFixed(5)}` : 'Coordinates unavailable'}
            />
            <InfoRow
              icon="radio-outline"
              label="Geofence radius"
              value={activeSite ? `${activeSite.radius_meters} m` : 'No geofence configured'}
              isLast
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionCaption, { color: c.textFaint }]}>APPEARANCE</Text>
          <View style={[styles.preferenceCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.preferenceLeft}>
              <View style={[styles.infoIconWrap, { backgroundColor: c.backgroundSoft }]}>
                <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={16} color={c.textMuted} />
              </View>
              <View style={styles.infoCopy}>
                <Text style={[styles.preferenceTitle, { color: c.foreground }]}>
                  {isDark ? 'Dark mode' : 'Light mode'}
                </Text>
                <Text style={[styles.preferenceText, { color: c.textMuted }]}>
                  Switch the operating interface appearance.
                </Text>
              </View>
            </View>

            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: c.border, true: `${c.accent}80` }}
              thumbColor={isDark ? c.accent : c.textMuted}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.signOutBtn, { borderColor: `${c.error}24`, backgroundColor: `${c.error}10` }]}
          onPress={handleSignOut}
          activeOpacity={0.82}
        >
          <Ionicons name="log-out-outline" size={18} color={c.error} />
          <Text style={[styles.signOutText, { color: c.error }]}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 18,
  },
  header: { gap: 6 },
  eyebrow: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.6,
  },
  pageTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize['2xl'],
  },
  pageSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 20,
    maxWidth: '94%',
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 18,
    backgroundColor: '#0b160d',
    gap: 18,
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    top: -120,
    right: -90,
  },
  heroTop: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 74,
    height: 74,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
  },
  avatar: {
    width: 74,
    height: 74,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroName: {
    color: '#ffffff',
    fontSize: FontSize.xl,
    fontFamily: Font.bold,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
  },
  heroHint: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
  },
  heroSiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroSiteLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: FontSize.xs,
    fontFamily: Font.medium,
    letterSpacing: 0.6,
  },
  heroSiteValue: {
    color: '#ffffff',
    fontSize: FontSize.lg,
    fontFamily: Font.semiBold,
    marginTop: 4,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(22,163,74,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.24)',
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#16a34a',
  },
  heroBadgeText: {
    color: '#8ff3b2',
    fontFamily: Font.semiBold,
    fontSize: FontSize.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  metricDivider: {
    width: 1,
    marginVertical: 12,
  },
  metricValue: {
    fontFamily: Font.bold,
    fontSize: FontSize['2xl'],
  },
  metricLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  section: {
    gap: 8,
  },
  sectionCaption: {
    fontSize: FontSize.xs,
    fontFamily: Font.semiBold,
    letterSpacing: 0.8,
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCopy: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
  },
  infoValue: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  preferenceCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  preferenceLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  preferenceTitle: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
  },
  preferenceText: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 18,
    marginTop: 1,
  },
  signOutBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  signOutText: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
  },
});
