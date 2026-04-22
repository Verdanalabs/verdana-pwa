import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { getMockBatches } from '@/src/shared/services/mock/batch-data';

function InfoRow({
  label, value,
}: { label: string; value: string }) {
  const c = useThemeColors();
  return (
    <TouchableOpacity
      style={[styles.infoRow, { borderBottomColor: c.border }]}
      activeOpacity={0.7}
    >
      <View style={[styles.infoIconWrap, { backgroundColor: c.background }]}>
        <Text style={[styles.infoIconLabel, { color: c.textMuted }]}>
          {label.slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <Text style={[styles.infoLabel, { color: c.foreground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: c.textSecondary }]}>{value}</Text>
      <Ionicons name="chevron-forward" size={14} color={c.textMuted} />
    </TouchableOpacity>
  );
}

export default function PvpFacilityTab() {
  const c = useThemeColors();
  const { operator, activeSite, signOut } = usePvpAuth();
  const batches = getMockBatches();

  const totalKg = batches.reduce((s, b) => s + (b.actualWeightKg ?? b.estimatedWeightKg), 0);
  const initials = operator?.display_name
    ?.split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'OP';

  function handleSignOut() {
    signOut();
    router.replace('/(auth)/pvp-login' as never);
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: c.foreground }]}>FACILITY</Text>
          <Text style={[styles.pageSub, { color: c.textMuted }]}>Profile and settings</Text>
        </View>

        {/* Profile avatar + name */}
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: c.accent + '20', borderColor: c.accent + '40' }]}>
            <Text style={[styles.avatarText, { color: c.accent }]}>{initials}</Text>
            <View style={[styles.avatarBadge, { backgroundColor: c.accent }]}>
              <Text style={[styles.avatarBadgeText, { color: c.accentContrast }]}>OP</Text>
            </View>
          </View>
          <Text style={[styles.facilityName, { color: c.foreground }]}>
            {activeSite?.name?.toUpperCase() ?? '—'}
          </Text>
          <Text style={[styles.facilityType, { color: c.textMuted }]}>
            PHYSICAL VALIDATION POINT
          </Text>
          <View style={[styles.stationPill, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={[styles.pillDot, { backgroundColor: '#10b981' }]} />
            <Text style={[styles.pillText, { color: c.textSecondary }]}>
              {activeSite?.id.slice(0, 8).toUpperCase() ?? '—'} · {activeSite?.latitude?.toFixed(4) ?? '—'}, {activeSite?.longitude?.toFixed(4) ?? '—'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: c.accent }]}>{batches.length}</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>TOTAL BATCHES</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: c.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: c.accent }]}>98.2%</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>ACCURACY</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: c.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: c.accent }]}>{totalKg}T</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>TOTAL KG</Text>
          </View>
        </View>

        {/* Active operator */}
        <View style={styles.group}>
          <Text style={[styles.groupLabel, { color: c.textMuted }]}>ACTIVE OPERATOR</Text>
          <View style={[styles.groupCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <TouchableOpacity style={[styles.infoRow, { borderBottomColor: 'transparent' }]} activeOpacity={0.7}>
              <View style={[styles.infoIconWrap, { backgroundColor: c.background }]}>
                <Text style={[styles.infoIconLabel, { color: c.textMuted }]}>OP</Text>
              </View>
              <Text style={[styles.infoLabel, { color: c.foreground }]}>{operator?.display_name?.toUpperCase() ?? '—'}</Text>
              <Text style={[styles.infoValue, { color: c.textSecondary }]}>{operator?.email ?? '—'}</Text>
              <Ionicons name="chevron-forward" size={14} color={c.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Facility info */}
        <View style={styles.group}>
          <Text style={[styles.groupLabel, { color: c.textMuted }]}>FACILITY</Text>
          <View style={[styles.groupCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <InfoRow label="WAREHOUSE CAPACITY" value="50 ton/day" />
            <InfoRow label="MATERIALS ACCEPTED" value="PET HDPE PP" />
            <InfoRow label="DIGITAL SCALE" value="Calibrated" />
          </View>
        </View>

        {/* Configuration */}
        <View style={styles.group}>
          <Text style={[styles.groupLabel, { color: c.textMuted }]}>CONFIGURATION</Text>
          <View style={[styles.groupCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <InfoRow label="WEIGHT TOLERANCE" value="±5%" />
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={[styles.signOutBtn, { borderColor: '#ef444440', backgroundColor: '#ef444410' }]}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
          <Text style={[styles.signOutText, { color: '#ef4444' }]}>Sign out</Text>
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
    gap: 24,
  },
  header: { gap: 2 },
  pageTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize.xl,
    letterSpacing: 0.8,
  },
  pageSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
  },
  profileSection: {
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    fontFamily: Font.bold,
    fontSize: FontSize['2xl'],
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  avatarBadgeText: {
    fontFamily: Font.bold,
    fontSize: FontSize.xs,
  },
  facilityName: {
    fontFamily: Font.bold,
    fontSize: FontSize.xl,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  facilityType: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    letterSpacing: 1,
    textAlign: 'center',
  },
  stationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  pillText: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  statDivider: {
    width: 1,
    marginVertical: 12,
  },
  statValue: {
    fontFamily: Font.bold,
    fontSize: FontSize['2xl'],
  },
  statLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  group: { gap: 8 },
  groupLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
  },
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    borderBottomWidth: 1,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconLabel: {
    fontFamily: Font.bold,
    fontSize: FontSize.xs,
  },
  infoLabel: {
    flex: 1,
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
    letterSpacing: 0.3,
  },
  infoValue: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
  },
  signOutBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutText: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
  },
});
