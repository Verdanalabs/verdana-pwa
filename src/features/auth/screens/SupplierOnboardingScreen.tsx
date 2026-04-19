import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/src/shared/ui/PrimaryButton';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useAuth } from '@/src/features/auth/state/auth-context';
import { useThemeColors } from '@/src/shared/theme/theme-context';

const MATERIAL_OPTIONS = ['PET', 'HDPE', 'PP', 'Mixed Plastic'];

export default function OnboardingProfileRoute() {
  const c = useThemeColors();
  const { provider, completeOnboarding, signOut } = useAuth();
  const [name, setName] = useState('');
  const [operationalArea, setOperationalArea] = useState('');
  const [primaryMaterial, setPrimaryMaterial] = useState('PET');
  const [touched, setTouched] = useState(false);

  const errors = useMemo(() => ({
    name: name.trim().length < 3 ? 'Enter your full name.' : '',
    operationalArea: operationalArea.trim().length < 3 ? 'Enter your operating area.' : '',
  }), [name, operationalArea]);

  const isValid = !errors.name && !errors.operationalArea;

  function handleSubmit() {
    setTouched(true);
    if (!isValid) return;

    completeOnboarding({
      name: name.trim(),
      operationalArea: operationalArea.trim(),
      primaryMaterial,
    });

    router.replace('/(supplier-tabs)/home');
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

        <View style={[styles.providerCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Ionicons name="checkmark-circle" size={18} color={c.accent} />
          <Text style={[styles.providerText, { color: c.textSecondary }]}>
            Signed in with {provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : 'mock account'}
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

          <View style={styles.field}>
            <Text style={[styles.label, { color: c.foreground }]}>Operating Area</Text>
            <TextInput
              value={operationalArea}
              onChangeText={setOperationalArea}
              placeholder="Bekasi, West Java"
              placeholderTextColor={c.textFaint}
              style={[
                styles.input,
                {
                  backgroundColor: c.surface,
                  borderColor: touched && errors.operationalArea ? c.error : c.border,
                  color: c.foreground,
                },
              ]}
            />
            {!!(touched && errors.operationalArea) && (
              <Text style={[styles.error, { color: c.error }]}>{errors.operationalArea}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: c.foreground }]}>Main Material</Text>
            <View style={styles.chips}>
              {MATERIAL_OPTIONS.map((option) => {
                const selected = primaryMaterial === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? c.accent : c.surface,
                        borderColor: selected ? c.accent : c.border,
                      },
                    ]}
                    onPress={() => setPrimaryMaterial(option)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: selected ? c.accentContrast : c.textSecondary },
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
        <PrimaryButton label="Continue to Home" onPress={handleSubmit} />
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
});
