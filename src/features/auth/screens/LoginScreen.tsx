import { Font, FontSize } from "@/src/shared/theme/typography";
import { useAuth } from "@/src/features/auth/state/auth-context";
import { useThemeColors } from "@/src/shared/theme/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LOGIN_OPTIONS = [
  // { id: "google",   label: "Continue with Google",   icon: "logo-google"    as const },
  // { id: "whatsapp", label: "Continue with WhatsApp", icon: "logo-whatsapp"  as const },
  { id: "email",    label: "Continue with Email",    icon: "mail-outline"   as const },
] as const;

export default function LoginRoute() {
  const c = useThemeColors();
  const { loginWithGoogle, loginWithEmail, loginWithSms, isAuthenticated, needsOnboarding } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    router.replace(needsOnboarding ? "/(auth)/onboarding-profile" : "/(supplier-tabs)/home");
  }, [isAuthenticated, needsOnboarding]);

  function handleLogin(provider: "google" | "whatsapp" | "email") {
    if (provider === "google") loginWithGoogle();
    else if (provider === "whatsapp") loginWithSms();
    else loginWithEmail();
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>

      {/* Decorative top accent */}
      <View style={[styles.topAccent, { backgroundColor: c.accent }]} />

      <View style={styles.root}>

        {/* Center card */}
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
            <Text style={[styles.heading, { color: c.foreground }]}>Sign in</Text>
            <Text style={[styles.sub, { color: c.textMuted }]}> 
              {"Choose how you'd like to continue."}
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.options}>
            {LOGIN_OPTIONS.map((opt, i) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.btn,
                  i === 0
                    ? { backgroundColor: c.foreground }
                    : { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
                ]}
                onPress={() => handleLogin(opt.id)}
                activeOpacity={0.82}
              >
                <Ionicons
                  name={opt.icon}
                  size={17}
                  color={i === 0 ? c.background : c.textSecondary}
                />
                <Text style={[styles.btnLabel, { color: i === 0 ? c.background : c.foreground }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer */}
        <TouchableOpacity onPress={() => router.replace("/(auth)/welcome")} activeOpacity={0.7}>
          <Text style={[styles.footer, { color: c.textFaint }]}>← Back to welcome</Text>
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
  },
  options: {
    gap: 10,
  },
  btn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  btnLabel: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.md,
  },
  footer: {
    textAlign: 'center',
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
  },
});
