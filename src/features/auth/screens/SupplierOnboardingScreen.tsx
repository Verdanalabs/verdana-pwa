import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/src/shared/ui/PrimaryButton';
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

  const errors = useMemo(() => ({
    name: name.trim().length < 3 ? 'Enter your full name.' : '',
  }), [name]);

  const isValid = !errors.name;

  async function handleSubmit() {
    setTouched(true);
    if (!isValid) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await completeOnboarding({ name: name.trim() });
      router.replace('/(supplier-tabs)/home');
    } catch {
      setSubmitError('Failed to save your name. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.foreground }]}>Set up your supplier profile.</Text>
          <Text style={[styles.body, { color: c.textSecondary }]}>
            Add the key details we need so your batch records stay clear from the start.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: c.foreground }]}>Full Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Tio Rahardian"
              placeholderTextColor={c.textFaint}
              style={[
                styles.input,
                {
                  backgroundColor: c.surface,
                  borderColor: touched && errors.name ? c.error : c.border,
                  color: c.foreground,
                },
              ]}
            />
            {!!(touched && errors.name) && <Text style={[styles.error, { color: c.error }]}>{errors.name}</Text>}
          </View>
        </View>

        <View style={[styles.noteCard, { backgroundColor: c.backgroundSoft, borderColor: c.border }]}>
          <Ionicons name="information-circle-outline" size={18} color={c.accent} />
          <Text style={[styles.noteText, { color: c.textSecondary }]}>
            You can update these details later when the profile screen is expanded.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: c.background, borderTopColor: c.border }]}>
        {!!submitError && (
          <Text style={[styles.submitError, { color: c.error }]}>{submitError}</Text>
        )}
        <PrimaryButton
          label={isSubmitting ? 'Saving...' : 'Continue to Home'}
          onPress={handleSubmit}
          disabled={isSubmitting}
        />
        <TouchableOpacity
          style={styles.secondaryAction}
          onPress={() => {
            signOut();
            router.replace('/(auth)/welcome');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.secondaryText, { color: c.textMuted }]}>Start over</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 18,
  },
  header: {
    gap: 8,
    marginBottom: 2,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontFamily: Font.bold,
    lineHeight: 28,
  },
  body: {
    fontSize: FontSize.md,
    fontFamily: Font.regular,
    lineHeight: 22,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  providerText: {
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: FontSize.sm,
    fontFamily: Font.semiBold,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: FontSize.md,
    fontFamily: Font.regular,
  },
  error: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontFamily: Font.semiBold,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  noteText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
    gap: 10,
  },
  secondaryAction: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  secondaryText: {
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
  },
  submitError: {
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    textAlign: 'center',
  },
});
