import { useEffect } from 'react';
import { ActivityIndicator, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCounterpartAppUrl } from '@/src/shared/config/app-variant';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';

export default function PvpLoginRoute() {
  const c = useThemeColors();
  const { invite: inviteParam } = useLocalSearchParams<{ invite?: string }>();
  const {
    state,
    isReady,
    invite,
    inviteError,
    setInviteToken,
    loginWithGoogle,
    loginWithEmail,
  } = usePvpAuth();

  useEffect(() => {
    setInviteToken(typeof inviteParam === 'string' ? inviteParam : null);
  }, [inviteParam, setInviteToken]);

  useEffect(() => {
    if (state === 'authenticated') router.replace('/pvp/onboarding' as never);
    if (state === 'pending' || state === 'rejected') router.replace('/pvp/pending-approval' as never);
    if (state === 'active') router.replace('/(pvp-tabs)/dashboard' as never);
  }, [state]);

  function openWhatsApp() {
    const msg = encodeURIComponent('Hi, I need a Verdana PVP processor invite link.');
    void Linking.openURL(`https://wa.me/6283875927641?text=${msg}`);
  }

  const hasInvite = Boolean(inviteParam);
  const canLogin = Boolean(invite?.is_usable) && isReady;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}> 
      <View style={[styles.topAccent, { backgroundColor: c.accent }]} />

      <View style={styles.root}>
        <View style={styles.card}>
          <View style={styles.logoWrap}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logoMark} resizeMode="contain" />
            <Text style={[styles.logoLabel, { color: c.textMuted }]}>VERDANA PROTOCOL</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: c.border }]} />

          <View style={styles.copy}>
            <Text style={[styles.heading, { color: c.foreground }]}>PVP Processor Access</Text>
            <Text style={[styles.sub, { color: c.textMuted }]}>Use your admin invite to register with Google or email.</Text>
          </View>

          {hasInvite ? (
            <View style={[styles.inviteCard, { backgroundColor: c.surface, borderColor: inviteError ? c.error : c.border }]}> 
              {!invite && !inviteError ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={c.accent} size="small" />
                  <Text style={[styles.inviteText, { color: c.textSecondary }]}>Checking invite link...</Text>
                </View>
              ) : inviteError ? (
                <>
                  <Ionicons name="alert-circle-outline" size={18} color={c.error} />
                  <View style={styles.inviteCopy}>
                    <Text style={[styles.inviteTitle, { color: c.foreground }]}>Invite unavailable</Text>
                    <Text style={[styles.inviteText, { color: c.textMuted }]}>{inviteError}</Text>
                  </View>
                </>
              ) : invite ? (
                <>
                  <Ionicons name="business-outline" size={18} color={c.accent} />
                  <View style={styles.inviteCopy}>
                    <Text style={[styles.inviteTitle, { color: c.foreground }]}>{invite.pvp_site.name}</Text>
                    <Text style={[styles.inviteText, { color: c.textMuted }]}>Invited email: {invite.email}</Text>
                  </View>
                </>
              ) : null}
            </View>
          ) : (
            <View style={[styles.inviteCard, { backgroundColor: c.surface, borderColor: c.border }]}> 
              <Ionicons name="mail-unread-outline" size={18} color={c.textMuted} />
              <View style={styles.inviteCopy}>
                <Text style={[styles.inviteTitle, { color: c.foreground }]}>Invite required</Text>
                <Text style={[styles.inviteText, { color: c.textMuted }]}>Ask Verdana admin for a PVP processor invite link.</Text>
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: canLogin ? c.foreground : c.border }]}
              onPress={loginWithGoogle}
              activeOpacity={0.85}
              disabled={!canLogin}
            >
              <Ionicons name="logo-google" size={18} color={canLogin ? c.background : c.textMuted} />
              <Text style={[styles.btnLabel, { color: canLogin ? c.background : c.textMuted }]}>Continue with Google</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: c.border }]}
              onPress={loginWithEmail}
              activeOpacity={0.85}
              disabled={!canLogin}
            >
              <Ionicons name="mail-outline" size={18} color={canLogin ? c.foreground : c.textMuted} />
              <Text style={[styles.secondaryBtnLabel, { color: canLogin ? c.foreground : c.textMuted }]}>Continue with Email</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: c.border }]} />

          <TouchableOpacity style={styles.waRow} onPress={openWhatsApp} activeOpacity={0.8}>
            <View style={styles.waText}>
              <Text style={[styles.waTitle, { color: c.textSecondary }]}>No invite link?</Text>
              <Text style={[styles.waSub, { color: c.textMuted }]}>Contact Verdana admin via WhatsApp.</Text>
            </View>
            <View style={[styles.waIcon, { backgroundColor: '#25D366' }]}> 
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => Linking.openURL(getCounterpartAppUrl())} activeOpacity={0.7}>
          <Text style={[styles.footer, { color: c.textFaint }]}>Are you a supplier? <Text style={[styles.footerLink, { color: c.textSecondary }]}>Login here</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topAccent: { height: 4, width: '38%', borderBottomRightRadius: 999, borderBottomLeftRadius: 999, alignSelf: 'center' },
  root: { flex: 1, paddingHorizontal: 28, paddingBottom: 36, justifyContent: 'center', gap: 28 },
  card: { gap: 24 },
  logoWrap: { alignItems: 'center', gap: 10 },
  logoMark: { width: 72, height: 72 },
  logoLabel: { fontFamily: Font.medium, fontSize: FontSize.xs, letterSpacing: 2 },
  divider: { height: 1, marginHorizontal: 8 },
  copy: { alignItems: 'center', gap: 6 },
  heading: { fontFamily: Font.bold, fontSize: 30, letterSpacing: -0.5, textAlign: 'center' },
  sub: { fontFamily: Font.regular, fontSize: FontSize.md, lineHeight: 22, textAlign: 'center' },
  inviteCard: { minHeight: 76, borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  inviteCopy: { flex: 1, gap: 4 },
  inviteTitle: { fontFamily: Font.semiBold, fontSize: FontSize.md },
  inviteText: { fontFamily: Font.regular, fontSize: FontSize.sm, lineHeight: 20 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actions: { gap: 10 },
  btn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  btnLabel: { fontFamily: Font.semiBold, fontSize: FontSize.md },
  secondaryBtn: { height: 52, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  secondaryBtnLabel: { fontFamily: Font.semiBold, fontSize: FontSize.md },
  waRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  waText: { flex: 1, gap: 3 },
  waTitle: { fontFamily: Font.semiBold, fontSize: FontSize.sm },
  waSub: { fontFamily: Font.regular, fontSize: FontSize.xs, lineHeight: 16 },
  waIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  footer: { textAlign: 'center', fontFamily: Font.regular, fontSize: FontSize.sm },
  footerLink: { fontFamily: Font.semiBold },
});
