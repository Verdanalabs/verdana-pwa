import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Font, FontSize } from '@/constants/typography';
import { useThemeColors } from '@/store/theme-context';
import { usePvpAuth } from '@/store/pvp-auth-context';

export default function PvpLoginRoute() {
  const c = useThemeColors();
  const { connectWallet } = usePvpAuth();

  function handleConnectWallet() {
    connectWallet();
    router.replace('/pvp/pending-approval');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <LinearGradient
        colors={[c.heroGradient[0], c.background]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={c.textSecondary} />
        </TouchableOpacity>

        <View style={styles.body}>
          <View style={[styles.iconWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="wallet-outline" size={36} color={c.accent} />
          </View>

          <View style={styles.copyBlock}>
            <Text style={[styles.title, { color: c.foreground }]}>
              Connect your wallet
            </Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              Your Solana wallet is your identity as a Drop-off Point operator. Connect to request access.
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={c.accent} />
              <Text style={[styles.infoText, { color: c.textSecondary }]}>
                Your wallet address is your unique operator ID
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color={c.accent} />
              <Text style={[styles.infoText, { color: c.textSecondary }]}>
                Access needs to be approved by admin before you can start
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="phone-portrait-outline" size={18} color={c.accent} />
              <Text style={[styles.infoText, { color: c.textSecondary }]}>
                Phantom, Solflare, or any Solana-compatible wallet
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.connectBtn, { backgroundColor: c.accent }]}
            onPress={handleConnectWallet}
            activeOpacity={0.85}
          >
            <Ionicons name="wallet-outline" size={20} color={c.accentContrast} />
            <Text style={[styles.connectBtnText, { color: c.accentContrast }]}>
              Connect Wallet
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.7}
        >
          <Text style={[styles.footer, { color: c.textMuted }]}>
            Are you a supplier?{' '}
            <Text style={[styles.footerLink, { color: c.foreground }]}>Login here</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  copyBlock: {
    gap: 10,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: FontSize['3xl'],
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: Font.regular,
    fontSize: FontSize.md,
    lineHeight: 24,
    maxWidth: 340,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  connectBtn: {
    height: 54,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  connectBtnText: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.lg,
  },
  footer: {
    textAlign: 'center',
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
  },
  footerLink: {
    fontFamily: Font.semiBold,
  },
});
