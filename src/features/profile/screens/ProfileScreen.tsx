import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/react-auth';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useAuth } from '@/src/features/auth/state/auth-context';
import { useTheme, useThemeColors } from '@/src/shared/theme/theme-context';

function dicebearUrl(name: string) {
  return `https://api.dicebear.com/9.x/avataaars-neutral/png?seed=${encodeURIComponent(name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

function shortAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function SettingRow({
  icon,
  label,
  hint,
  iconColor,
  iconBg,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  iconColor: string;
  iconBg: string;
  onPress?: () => void;
}) {
  const c = useThemeColors();

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: c.surface, borderColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: c.foreground }]}>{label}</Text>
        <Text style={[styles.rowHint, { color: c.textMuted }]}>{hint}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={c.textFaint} />
    </TouchableOpacity>
  );
}

export default function ProfileRoute() {
  const c = useThemeColors();
  const router = useRouter();
  const { isDark, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const { user: privyUser } = usePrivy();

  const displayName = user?.display_name ?? 'Supplier';

  const signInMethod = (() => {
    const accounts = privyUser?.linkedAccounts ?? [];
    if (accounts.some((a) => a.type === 'google_oauth')) return 'Google';
    if (accounts.some((a) => a.type === 'email')) return 'Email';
    if (accounts.some((a) => a.type === 'phone')) return 'Phone';
    return 'Privy';
  })();

  function handleSignOut() {
    signOut();
    router.replace('/(auth)/welcome');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.foreground }]}>Profile</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Your account details, wallet access, and app settings.
          </Text>
        </View>

        {/* Hero card */}
        <View style={[styles.heroCard, { borderColor: c.border }]}>
          <View style={[styles.heroGlow, { backgroundColor: c.heroGlowColor }]} />

          <View style={styles.heroTop}>
            <View style={[styles.avatarWrap, { borderColor: 'rgba(255,255,255,0.10)' }]}>
              <Image source={{ uri: dicebearUrl(displayName) }} style={styles.avatar} contentFit="cover" />
            </View>

            <View style={styles.heroCopy}>
              <Text style={styles.heroName}>{displayName}</Text>
              <Text style={styles.heroMeta}>Waste Collector</Text>
              {user?.email && (
                <Text style={styles.heroHint}>{user.email}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Account */}
        <View style={[styles.sectionCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Account</Text>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: c.textMuted }]}>Sign-in method</Text>
            <Text style={[styles.detailValue, { color: c.foreground }]}>{signInMethod}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: c.textMuted }]}>Email</Text>
            <Text style={[styles.detailValue, { color: c.foreground }]}>{user?.email ?? '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: c.textMuted }]}>Wallet</Text>
            <Text style={[styles.detailValue, { color: c.foreground }]}>
              {user?.wallet_address ? shortAddress(user.wallet_address) : '-'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionCaption, { color: c.textFaint }]}>ACCESS</Text>

          <SettingRow
            icon="wallet-outline"
            label="Open Wallet"
            hint="Review assets, wallet address, and current balances"
            iconColor={c.accent}
            iconBg={`${c.accent}16`}
            onPress={() => router.push('/(supplier-tabs)/wallet')}
          />
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionCaption, { color: c.textFaint }]}>APPEARANCE</Text>

          <SettingRow
            icon={isDark ? 'moon' : 'sunny'}
            label={isDark ? 'Dark Mode' : 'Light Mode'}
            hint={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            iconColor={c.accent}
            iconBg={isDark ? 'rgba(181,242,61,0.12)' : 'rgba(150,204,46,0.12)'}
            onPress={toggle}
          />
        </View>

        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionCaption, { color: c.textFaint }]}>ACCOUNT ACTIONS</Text>

          <SettingRow
            icon="log-out-outline"
            label="Sign Out"
            hint="Sign out and return to the welcome screen"
            iconColor={c.error}
            iconBg={`${c.error}18`}
            onPress={handleSignOut}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 18, paddingBottom: 36 },
  header: { gap: 6 },
  title: { fontSize: FontSize['2xl'], fontFamily: Font.bold, lineHeight: 28 },
  subtitle: { fontSize: FontSize.md, fontFamily: Font.regular, lineHeight: 22, maxWidth: 310 },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 18,
    backgroundColor: '#0b160d',
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    top: -120,
    right: -90,
  },
  heroTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatarWrap: { width: 74, height: 74, borderRadius: 22, overflow: 'hidden', borderWidth: 1 },
  avatar: { width: 74, height: 74 },
  heroCopy: { flex: 1, gap: 4 },
  heroName: { color: '#ffffff', fontSize: FontSize.xl, fontFamily: Font.bold },
  heroMeta: { color: 'rgba(255,255,255,0.72)', fontSize: FontSize.sm, fontFamily: Font.medium },
  heroHint: { color: 'rgba(255,255,255,0.50)', fontSize: FontSize.sm, fontFamily: Font.regular },
  sectionCard: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 14 },
  sectionTitle: { fontSize: FontSize.lg, fontFamily: Font.bold },
  detailRow: { gap: 4 },
  detailLabel: { fontSize: FontSize.sm, fontFamily: Font.regular },
  detailValue: { fontSize: FontSize.sm, lineHeight: 20, fontFamily: Font.medium },
  sectionBlock: { gap: 8 },
  sectionCaption: { fontSize: FontSize.xs, fontFamily: Font.semiBold, letterSpacing: 0.8 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 14, borderRadius: 14, borderWidth: 1,
  },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  rowHint: { fontSize: FontSize.sm, fontFamily: Font.regular, marginTop: 1, lineHeight: 20 },
});
