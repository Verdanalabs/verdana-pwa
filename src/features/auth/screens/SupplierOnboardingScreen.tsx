import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useAuth } from '@/src/features/auth/state/auth-context';
import { useThemeColors } from '@/src/shared/theme/theme-context';

export default function OnboardingProfileRoute() {
  const c = useThemeColors();
  const { completeOnboarding, signOut } = useAuth();

  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nameError = useMemo(() => name.trim().length < 3 ? 'Enter at least 3 characters.' : '', [name]);
  const canSubmit = !nameError && !isSubmitting;

  async function handleSubmit() {
    setTouched(true);
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await completeOnboarding({ name: name.trim() });
      router.replace('/(supplier-tabs)/home');
    } catch {
      setSubmitError('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.root}>

          {/* Step tag */}
          <View style={[styles.stepTag, { backgroundColor: c.accent + '18', borderColor: c.accent + '30' }]}>
            <Text style={[styles.stepText, { color: c.accent }]}>SETUP · STEP 1 OF 1</Text>
          </View>

          {/* Heading */}
          <View style={styles.headingBlock}>
            <Text style={[styles.heading, { color: c.foreground }]}>
              What should{'\n'}we call you?
            </Text>
            <Text style={[styles.sub, { color: c.textMuted }]}>
              Your name will appear on batch records and co-sign documents.
            </Text>
          </View>

          {/* Input */}
          <View style={styles.inputBlock}>
            <TextInput
              value={name}
              onChangeText={(v) => { setName(v); setTouched(false); setSubmitError(null); }}
              placeholder="Your full name"
              placeholderTextColor={c.textFaint}
              style={[
                styles.input,
                {
                  borderColor: touched && nameError ? c.error + '70' : name.length > 0 ? c.accent : c.border,
                  color: c.foreground,
                  backgroundColor: c.surface,
                },
              ]}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            {touched && nameError
              ? <Text style={[styles.hint, { color: c.error }]}>{nameError}</Text>
              : name.trim().length >= 3
                ? <Text style={[styles.hint, { color: c.accent }]}>Looks good!</Text>
                : <Text style={[styles.hint, { color: c.textFaint }]}>First and last name preferred.</Text>
            }
          </View>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Error */}
          {submitError
            ? <Text style={[styles.submitError, { color: c.error }]}>{submitError}</Text>
            : null
          }

          {/* CTA */}
          <TouchableOpacity
            style={[
              styles.btn,
              { backgroundColor: name.trim().length >= 3 ? c.foreground : c.border },
            ]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={!canSubmit}
          >
            <Text style={[styles.btnLabel, { color: name.trim().length >= 3 ? c.background : c.textMuted }]}>
              {isSubmitting ? 'Saving...' : 'Continue →'}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <TouchableOpacity
            onPress={() => { signOut(); router.replace('/(auth)/welcome'); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.footer, { color: c.textFaint }]}>← Start over</Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  root: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 36,
    gap: 24,
  },
  stepTag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  stepText: {
    fontFamily: Font.semiBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  headingBlock: {
    gap: 10,
  },
  heading: {
    fontFamily: Font.bold,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.8,
  },
  sub: {
    fontFamily: Font.regular,
    fontSize: FontSize.md,
    lineHeight: 22,
    maxWidth: 300,
  },
  inputBlock: {
    gap: 8,
  },
  input: {
    height: 58,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: FontSize.lg,
    fontFamily: Font.medium,
  },
  hint: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    paddingHorizontal: 4,
  },
  spacer: { flex: 1 },
  submitError: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  btn: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
