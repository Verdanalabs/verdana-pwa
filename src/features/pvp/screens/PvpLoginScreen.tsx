import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';

export default function PvpLoginRoute() {
  const c = useThemeColors();
  const { loginWithCredentials } = usePvpAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isLoading;

  async function handleLogin() {
    if (!canSubmit) return;
    setIsLoading(true);
    setError(null);
    try {
      await loginWithCredentials(email.trim(), password);
      router.replace('/pvp/onboarding');
    } catch {
      setError('Email or password is incorrect.');
    } finally {
      setIsLoading(false);
    }
  }

  function openWhatsApp() {
    const msg = encodeURIComponent('Hi, I would like to register as a PVP operator on Verdana Protocol.');
    void Linking.openURL(`https://wa.me/6283875927641?text=${msg}`);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>

      {/* Top accent bar */}
      <View style={[styles.topAccent, { backgroundColor: c.accent }]} />

      <View style={styles.root}>
        <View style={styles.card}>

          {/* Logo */}
          <View style={styles.logoWrap}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logoMark}
              resizeMode="contain"
            />
            <Text style={[styles.logoLabel, { color: c.textMuted }]}>VERDANA PROTOCOL</Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: c.border }]} />

          {/* Copy */}
          <View style={styles.copy}>
            <Text style={[styles.heading, { color: c.foreground }]}>Operator Login</Text>
            <Text style={[styles.sub, { color: c.textMuted }]}>
              Sign in to access your drop-off point dashboard.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={[styles.inputWrap, { backgroundColor: c.surface, borderColor: error ? c.error + '60' : c.border }]}>
              <Ionicons name="mail-outline" size={17} color={c.textMuted} />
              <TextInput
                value={email}
                onChangeText={(v) => { setEmail(v); setError(null); }}
                placeholder="Email address"
                placeholderTextColor={c.textFaint}
                style={[styles.input, { color: c.foreground }]}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.inputWrap, { backgroundColor: c.surface, borderColor: error ? c.error + '60' : c.border }]}>
              <Ionicons name="lock-closed-outline" size={17} color={c.textMuted} />
              <TextInput
                value={password}
                onChangeText={(v) => { setPassword(v); setError(null); }}
                placeholder="Password"
                placeholderTextColor={c.textFaint}
                style={[styles.input, { color: c.foreground }]}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword((p) => !p)} activeOpacity={0.7} hitSlop={8}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            {error && (
              <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>
            )}

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: canSubmit ? c.foreground : c.border }]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={!canSubmit}
            >
              {isLoading
                ? <ActivityIndicator color={c.background} size="small" />
                : <Text style={[styles.btnLabel, { color: canSubmit ? c.background : c.textMuted }]}>Sign In</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: c.border }]} />

          {/* Register info */}
          <TouchableOpacity style={styles.waRow} onPress={openWhatsApp} activeOpacity={0.8}>
            <View style={styles.waText}>
              <Text style={[styles.waTitle, { color: c.textSecondary }]}>Want to become an operator?</Text>
              <Text style={[styles.waSub, { color: c.textMuted }]}>Contact admin via WhatsApp to register.</Text>
            </View>
            <View style={[styles.waIcon, { backgroundColor: '#25D366' }]}>
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            </View>
          </TouchableOpacity>

        </View>

        {/* Footer */}
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} activeOpacity={0.7}>
          <Text style={[styles.footer, { color: c.textFaint }]}>
            Are you a supplier?{' '}
            <Text style={[styles.footerLink, { color: c.textSecondary }]}>Login here</Text>
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topAccent: {
    height: 4,
    width: '38%',
    borderBottomRightRadius: 999,
    borderBottomLeftRadius: 999,
    alignSelf: 'center',
  },
  root: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 36,
    justifyContent: 'center',
    gap: 28,
  },
  card: {
    gap: 24,
  },
  logoWrap: {
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 72,
    height: 72,
  },
  logoLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.xs,
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: 8,
  },
  copy: {
    alignItems: 'center',
    gap: 6,
  },
  heading: {
    fontFamily: Font.bold,
    fontSize: 32,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: Font.regular,
    fontSize: FontSize.md,
    lineHeight: 22,
    textAlign: 'center',
  },
  form: {
    gap: 10,
  },
  inputWrap: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: FontSize.md,
  },
  errorText: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  btnLabel: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
  },
  waRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  waText: {
    flex: 1,
    gap: 3,
  },
  waTitle: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
  },
  waSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  waIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
