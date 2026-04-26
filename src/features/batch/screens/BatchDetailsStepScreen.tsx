import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/src/shared/ui/PrimaryButton';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { useBatchDraft } from '@/src/features/batch/state/batch-draft-context';
import type { BatchGrade, MaterialType } from '@/types';

const MATERIAL_OPTIONS: MaterialType[] = ['PET', 'HDPE', 'LDPE', 'PP', 'MIX'];
const GRADE_OPTIONS: BatchGrade[] = ['A', 'B', 'C'];

function StepHeader({ step, title, body }: { step: string; title: string; body: string }) {
  const c = useThemeColors();

  return (
    <View style={styles.header}>
      <Text style={[styles.stepText, { color: c.accent }]}>{step}</Text>
      <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
      <Text style={[styles.body, { color: c.textSecondary }]}>{body}</Text>
    </View>
  );
}

export default function BatchDetailsRoute() {
  const c = useThemeColors();
  const { draft, setDetails } = useBatchDraft();

  const [materialType, setMaterialType] = useState<MaterialType>(draft.materialType ?? 'PET');
  const [estimatedWeightKg, setEstimatedWeightKg] = useState(draft.estimatedWeightKg);
  const [grade, setGrade] = useState<BatchGrade>(draft.grade ?? 'A');

  const weightError = useMemo(() => {
    if (!estimatedWeightKg.trim()) return 'Add the estimated weight before you continue.';
    const parsed = Number(estimatedWeightKg);
    if (Number.isNaN(parsed) || parsed <= 0) return 'Use a valid weight in kilograms.';
    return null;
  }, [estimatedWeightKg]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color={c.foreground} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <StepHeader
            step="Step 2 of 4"
            title="Add the batch details."
            body="Keep this short and clear so the drop-off team can review the batch faster."
          />

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.foreground }]}>Main Material</Text>
            <View style={styles.materialGrid}>
              {MATERIAL_OPTIONS.map((option) => {
                const selected = option === materialType;
                return (
                  <Pressable
                    key={option}
                    style={[
                      styles.materialCard,
                      {
                        backgroundColor: selected ? c.accent : c.surface,
                        borderColor: selected ? c.accent : c.border,
                      },
                    ]}
                    onPress={() => setMaterialType(option)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: selected ? c.accentContrast : c.foreground },
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.foreground }]}>Estimated Weight</Text>
            <View style={[styles.inputWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
              <TextInput
                value={estimatedWeightKg}
                onChangeText={setEstimatedWeightKg}
                placeholder="Enter weight in kg"
                placeholderTextColor={c.textMuted}
                keyboardType="numeric"
                style={[styles.input, { color: c.foreground }]}
              />
              <Text style={[styles.inputUnit, { color: c.textSecondary }]}>kg</Text>
            </View>
            {weightError ? <Text style={[styles.errorText, { color: '#ff7a7a' }]}>{weightError}</Text> : null}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.foreground }]}>Material Grade</Text>
            <View style={styles.gradeRow}>
              {GRADE_OPTIONS.map((option) => {
                const selected = option === grade;
                return (
                  <Pressable
                    key={option}
                    style={[
                      styles.gradeCard,
                      {
                        backgroundColor: c.surface,
                        borderColor: selected ? c.accent : c.border,
                      },
                    ]}
                    onPress={() => setGrade(option)}
                  >
                    <Text style={[styles.gradeLabel, { color: c.textSecondary }]}>Grade</Text>
                    <Text
                      style={[
                        styles.gradeValue,
                        { color: selected ? c.accent : c.foreground },
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
          <PrimaryButton
            label="Continue to Location"
            onPress={() => {
              if (weightError) return;
              setDetails({ materialType, estimatedWeightKg, grade });
              router.push('/batch/new/location');
            }}
            disabled={Boolean(weightError)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screen: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 6,
  },
  stepText: {
    fontSize: FontSize.sm,
    fontFamily: Font.semiBold,
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
    maxWidth: 320,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 12,
  },
  sectionLabel: {
    fontSize: FontSize.md,
    fontFamily: Font.semiBold,
  },
  materialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  materialCard: {
    width: '47%',
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: FontSize.sm,
    fontFamily: Font.semiBold,
  },
  inputWrap: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: FontSize.lg,
    fontFamily: Font.medium,
  },
  inputUnit: {
    fontSize: FontSize.md,
    fontFamily: Font.semiBold,
  },
  errorText: {
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
    lineHeight: 18,
  },
  gradeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gradeCard: {
    flex: 1,
    minHeight: 96,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    justifyContent: 'space-between',
  },
  gradeLabel: {
    fontSize: FontSize.sm,
    fontFamily: Font.medium,
  },
  gradeValue: {
    fontSize: 32,
    fontFamily: Font.bold,
    lineHeight: 36,
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 22,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: Font.regular,
    lineHeight: 20,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
});
