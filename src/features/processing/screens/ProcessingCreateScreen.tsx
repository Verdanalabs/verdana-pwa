import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { createProcessingBatch } from '@/src/features/processing/services/processing-api';

const MATERIALS = ['PET', 'HDPE', 'LDPE', 'PP', 'MIX', 'CARDBOARD', 'METAL', 'GLASS'];

export default function ProcessingCreateScreen() {
  const c = useThemeColors();
  const { token } = usePvpAuth();
  const [material, setMaterial] = useState('PET');
  const [weightKg, setWeightKg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!token) return;
    const grams = Math.round(parseFloat(weightKg) * 1000);
    if (!grams || grams <= 0) {
      setError('Enter a valid initial weight.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const batch = await createProcessingBatch(token, {
        material: material.toLowerCase(),
        initial_weight_grams: grams,
      });
      router.replace(`/processing/${batch.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create batch.');
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: c.surface, borderColor: c.border }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: c.foreground }]}>New Processing Batch</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.label, { color: c.foreground }]}>Material</Text>
          <View style={styles.chips}>
            {MATERIALS.map((m) => {
              const active = m === material;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, { borderColor: active ? c.accent : c.border, backgroundColor: active ? `${c.accent}18` : c.background }]}
                  onPress={() => setMaterial(m)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, { color: active ? c.accent : c.textSecondary }]}>{m}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.label, { color: c.foreground }]}>Initial Weight</Text>
          <View style={[styles.inputRow, { borderColor: c.border, backgroundColor: c.background }]}>
            <TextInput
              value={weightKg}
              onChangeText={setWeightKg}
              placeholder="0.0"
              placeholderTextColor={c.textFaint}
              keyboardType="decimal-pad"
              style={[styles.input, { color: c.foreground }]}
            />
            <Text style={[styles.unit, { color: c.textSecondary }]}>kg</Text>
          </View>
        </View>

        {error && (
          <View style={[styles.errorCard, { backgroundColor: `${c.error}12`, borderColor: `${c.error}25` }]}>
            <Ionicons name="alert-circle-outline" size={16} color={c.error} />
            <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
        {isSubmitting ? (
          <View style={styles.loadingRow}><ActivityIndicator color={c.accent} /></View>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: weightKg.trim() ? c.accent : c.border }]}
            onPress={handleCreate}
            disabled={!weightKg.trim()}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryBtnLabel, { color: weightKg.trim() ? c.accentContrast : c.textMuted }]}>Create Batch</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: FontSize.lg, fontFamily: Font.bold },
  content: { padding: 20, gap: 14 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  label: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: FontSize.sm, fontFamily: Font.semiBold },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 56 },
  input: { flex: 1, fontSize: FontSize['2xl'], fontFamily: Font.bold },
  unit: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  errorCard: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 14, padding: 14, alignItems: 'flex-start' },
  errorText: { flex: 1, fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
  footer: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, borderTopWidth: 1 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 54 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 54, borderRadius: 16 },
  primaryBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
});
