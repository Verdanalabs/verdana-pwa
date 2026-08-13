import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { NoticeCard } from '@/src/shared/ui/NoticeCard';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { createProcessingBatch } from '@/src/features/processing/services/processing-api';
import { ProofPhotoField, type CapturedProof } from '@/src/shared/ui/ProofPhotoField';
import { uploadProofPhoto } from '@/src/shared/lib/upload-proof';
import { useBestEffortGps } from '@/src/shared/hooks/useBestEffortGps';
import { parseWeightKg, sanitizeWeightInput, weightErrorMessage } from '@/src/shared/lib/weight';
import { CarbonImpactBadge } from '@/src/shared/ui/CarbonImpactBadge';

const MATERIALS = ['PET', 'HDPE', 'LDPE', 'PP', 'MIX', 'CARDBOARD', 'METAL', 'GLASS'];

export default function ProcessingCreateScreen() {
  const c = useThemeColors();
  const { token, operator, activeSite } = usePvpAuth();
  const gps = useBestEffortGps();
  const [material, setMaterial] = useState('PET');
  const [weightKg, setWeightKg] = useState('');
  const [proof, setProof] = useState<CapturedProof | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parseWeightKg(weightKg);

  async function handleCreate() {
    if (!token) return;
    if (!parsed.ok) {
      setError(weightErrorMessage(parsed.reason));
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      // No id exists yet, so the key is namespaced by a client-side uuid.
      const uploaded = proof ? await uploadProofPhoto(token, 'processing', proof) : undefined;
      const batch = await createProcessingBatch(token, {
        material: material.toLowerCase(),
        initial_weight_grams: Math.round(parsed.kg * 1000),
        proof: uploaded,
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
              onChangeText={(t) => setWeightKg(sanitizeWeightInput(t))}
              placeholder="0.0"
              placeholderTextColor={c.textFaint}
              keyboardType="decimal-pad"
              style={[styles.input, { color: c.foreground }]}
            />
            <Text style={[styles.unit, { color: c.textSecondary }]}>kg</Text>
          </View>

          <CarbonImpactBadge weightInput={weightKg} material={material} />

          <ProofPhotoField
            label="Intake proof photo"
            hint="Frame the scale display and the material together"
            helper="Photograph the intake weighing. Time, location, weight and your operator ID are stamped onto the photo."
            proof={proof}
            onChange={setProof}
            buildMeta={() =>
              parsed.ok
                ? {
                    timestampIso: new Date().toISOString(),
                    latitude: gps?.latitude,
                    longitude: gps?.longitude,
                    weightKg: parsed.kg,
                    category: `${material} INTAKE`,
                    operatorId: operator?.id ?? '',
                    stationLabel: activeSite?.name,
                  }
                : null
            }
            disabledReason="Enter the intake weight first — it is stamped onto the photo."
          />
        </View>

        {error && (
          <NoticeCard tone="danger">{error}</NoticeCard>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
        {isSubmitting ? (
          <View style={styles.loadingRow}><ActivityIndicator color={c.accentInk} /></View>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: parsed.ok ? c.accent : c.border }]}
            onPress={handleCreate}
            disabled={!parsed.ok}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryBtnLabel, { color: parsed.ok ? c.accentContrast : c.textMuted }]}>Create Batch</Text>
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
