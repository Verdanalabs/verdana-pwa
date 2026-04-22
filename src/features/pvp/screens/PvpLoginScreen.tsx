import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

  async function handleLogin() {
    if (!email.trim() || !password) return;
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <LinearGradient
        colors={[c.heroGradient[0], c.background]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={c.textSecondary} />
        </TouchableOpacity>

        <View style={styles.body}>
          <View style={[styles.iconWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="storefront-outline" size={36} color={c.accent} />
          </View>

          <View style={styles.copyBlock}>
            <Text style={[styles.title, { color: c.foreground }]}>Operator Login</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              Sign in with your Drop-off Point operator credentials.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name="mail-outline" size={18} color={c.textMuted} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={c.textFaint}
                style={[styles.input, { color: c.foreground }]}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={[styles.inputWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={c.textMuted} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={c.textFaint}
                style={[styles.input, { color: c.foreground }]}
                secureTextEntry
              />
            </View>

            {error && (
              <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: (!email || !password || isLoading) ? c.surface : c.accent }]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={!email || !password || isLoading}
          >
            {isLoading
              ? <ActivityIndicator color={c.accentContrast} />
              : <>
                  <Ionicons name="log-in-outline" size={20} color={(!email || !password) ? c.textMuted : c.accentContrast} />
                  <Text style={[styles.loginBtnText, { color: (!email || !password) ? c.textMuted : c.accentContrast }]}>
                    Sign In
                  </Text>
                </>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} activeOpacity={0.7}>
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
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 28 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  body: { flex: 1, justifyContent: 'center', gap: 24 },
  iconWrap: { width: 72, height: 72, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  copyBlock: { gap: 10 },
  title: { fontFamily: Font.bold, fontSize: FontSize['3xl'], lineHeight: 36 },
  subtitle: { fontFamily: Font.regular, fontSize: FontSize.md, lineHeight: 24, maxWidth: 340 },
  form: { gap: 12 },
  inputWrap: { height: 54, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, fontFamily: Font.regular, fontSize: FontSize.md },
  errorText: { fontFamily: Font.regular, fontSize: FontSize.sm, textAlign: 'center' },
  loginBtn: { height: 54, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  loginBtnText: { fontFamily: Font.semiBold, fontSize: FontSize.lg },
  footer: { textAlign: 'center', fontFamily: Font.regular, fontSize: FontSize.sm },
  footerLink: { fontFamily: Font.semiBold },
});
