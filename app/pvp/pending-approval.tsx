import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/constants/typography';
import { useThemeColors } from '@/store/theme-context';
import { usePvpAuth } from '@/store/pvp-auth-context';

export default function PvpPendingApprovalRoute() {
  const c = useThemeColors();
  const { walletAddress, simulateApprove, simulateReject } = usePvpAuth();

  function handleApprove() {
    simulateApprove();
    router.replace('/pvp/onboarding');
  }

  function handleReject() {
    simulateReject();
    router.replace('/(auth)/pvp-login');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <View style={styles.content}>

        <View style={styles.body}>
          <View style={[styles.iconWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="hourglass-outline" size={36} color={c.accent} />
          </View>

          <View style={styles.copyBlock}>
            <Text style={[styles.title, { color: c.foreground }]}>
              Waiting for approval
            </Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              Your wallet has been submitted. An admin will review and approve your access before you can start operating.
            </Text>
          </View>

          <View style={[styles.walletCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.walletLabel, { color: c.textMuted }]}>Connected wallet</Text>
            <View style={styles.walletRow}>
              <Ionicons name="wallet-outline" size={16} color={c.textSecondary} />
              <Text style={[styles.walletAddress, { color: c.foreground }]}>
                {walletAddress}
              </Text>
            </View>
          </View>

          <View style={[styles.statusCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={[styles.statusText, { color: c.textSecondary }]}>
                Pending admin review
              </Text>
            </View>
            <Text style={[styles.statusHint, { color: c.textMuted }]}>
              You&apos;ll be able to proceed once your access is approved. This usually takes a short time.
            </Text>
          </View>
        </View>

        {/* DEV ONLY — tombol simulate admin, hapus setelah backend nyambung */}
        <View style={[styles.devBlock, { borderColor: c.border }]}>
          <Text style={[styles.devLabel, { color: c.textMuted }]}>
            🔧 Dev only — simulate admin decision
          </Text>
          <View style={styles.devButtons}>
            <TouchableOpacity
              style={[styles.devBtn, { backgroundColor: '#16a34a' }]}
              onPress={handleApprove}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.devBtnText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devBtn, { backgroundColor: '#dc2626' }]}
              onPress={handleReject}
              activeOpacity={0.85}
            >
              <Ionicons name="close-circle-outline" size={18} color="#fff" />
              <Text style={styles.devBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleReject}
          activeOpacity={0.7}
        >
          <Text style={[styles.footer, { color: c.textMuted }]}>
            Wrong wallet?{' '}
            <Text style={[styles.footerLink, { color: c.foreground }]}>Disconnect</Text>
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
    paddingTop: 40,
    paddingBottom: 28,
    gap: 20,
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
  walletCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  walletLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletAddress: {
    fontFamily: Font.medium,
    fontSize: FontSize.md,
  },
  statusCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: Font.medium,
    fontSize: FontSize.md,
  },
  statusHint: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  devBlock: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  devLabel: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  devButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  devBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  devBtnText: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
    color: '#fff',
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
