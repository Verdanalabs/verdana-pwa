import { Font, FontSize } from "@/constants/typography";
import { useAuth } from "@/store/auth-context";
import { useThemeColors } from "@/store/theme-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LOGIN_OPTIONS = [
  {
    id: "google",
    title: "Continue with Google",
    icon: "logo-google" as const,
  },
  {
    id: "whatsapp",
    title: "Continue with WhatsApp",
    icon: "logo-whatsapp" as const,
  },
  {
    id: "email",
    title: "Continue with Email",
    icon: "mail-outline" as const,
  },
];

export default function LoginRoute() {
  const c = useThemeColors();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(provider: "google" | "whatsapp" | "email") {
    login(provider);
    router.replace("/(supplier-tabs)/home");
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <View style={styles.content}>
        <View style={styles.centerBlock}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.foreground }]}>Login</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              Sign in with the method that works best for your daily work.
            </Text>
          </View>

          <View style={styles.form}>
            <View
              style={[
                styles.inputWrap,
                { backgroundColor: c.surface, borderColor: c.border },
              ]}
            >
              <Ionicons name="mail-outline" size={18} color={c.textMuted} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={c.textFaint}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { color: c.foreground }]}
              />
            </View>

            <View
              style={[
                styles.inputWrap,
                { backgroundColor: c.surface, borderColor: c.border },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={c.textMuted}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={c.textFaint}
                secureTextEntry
                style={[styles.input, { color: c.foreground }]}
              />
              <Ionicons name="eye-off-outline" size={18} color={c.textFaint} />
            </View>

            <TouchableOpacity style={styles.forgotWrap} activeOpacity={0.7}>
              <Text style={[styles.forgotText, { color: c.textSecondary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryCta, { backgroundColor: c.accent }]}
              onPress={() => handleLogin("email")}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.primaryCtaText, { color: c.accentContrast }]}
              >
                Login
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.optionList}>
            {LOGIN_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  { backgroundColor: c.surface, borderColor: c.border },
                ]}
                onPress={() => handleLogin(option.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={option.icon}
                  size={18}
                  color={c.textSecondary}
                />
                <Text style={[styles.optionLabel, { color: c.foreground }]}>
                  {option.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.replace("/(auth)/welcome")}
          activeOpacity={0.7}
        >
          <Text style={[styles.footerText, { color: c.textMuted }]}>
            Need a simpler start?{" "}
            <Text style={[styles.footerLink, { color: c.foreground }]}>
              Go back
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
  },
  centerBlock: {
    gap: 22,
  },
  header: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: FontSize["3xl"],
    fontFamily: Font.bold,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: FontSize.md,
    fontFamily: Font.regular,
    lineHeight: 22,
    textAlign: "center",
  },
  form: {
    gap: 12,
  },
  inputWrap: {
    height: 56,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: Font.regular,
  },
  forgotWrap: {
    alignItems: "flex-end",
    paddingHorizontal: 4,
    marginTop: -2,
  },
  forgotText: {
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
  },
  primaryCta: {
    height: 54,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryCtaText: {
    fontSize: FontSize.lg,
    fontFamily: Font.semiBold,
  },
  optionList: {
    gap: 10,
    marginTop: 4,
  },
  optionButton: {
    height: 54,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  optionLabel: {
    fontSize: FontSize.md,
    fontFamily: Font.semiBold,
  },
  footerText: {
    textAlign: "center",
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    marginTop: "auto",
    paddingTop: 28,
  },
  footerLink: {
    fontFamily: Font.semiBold,
  },
});
