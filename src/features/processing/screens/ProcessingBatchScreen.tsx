import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { NoticeCard } from '@/src/shared/ui/NoticeCard';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import {
  addProcessingStage,
  completeProcessing,
  getProcessingBatch,
  type ProcessingBatch,
} from '@/src/features/processing/services/processing-api';
import { ProofPhotoField, type CapturedProof } from '@/src/shared/ui/ProofPhotoField';
import { PhotoLightbox } from '@/src/shared/ui/PhotoLightbox';
import { uploadProofPhoto } from '@/src/shared/lib/upload-proof';
import { useBestEffortGps } from '@/src/shared/hooks/useBestEffortGps';
import { parseWeightKg, sanitizeWeightInput, weightErrorMessage } from '@/src/shared/lib/weight';
import { runtimeConfig } from '@/src/shared/config/runtime-config';

const STAGES = ['sorting', 'washing', 'shredding', 'drying'];
const GRADES = ['A', 'B', 'C'];

function mediaUrl(storageKey: string) {
  return `${runtimeConfig.apiBaseUrl}/v1/media/${storageKey}`;
}

export default function ProcessingBatchScreen() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, operator, activeSite } = usePvpAuth();
  const gps = useBestEffortGps();

  const [batch, setBatch] = useState<ProcessingBatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stage, setStage] = useState('sorting');
  const [stageNotes, setStageNotes] = useState('');
  const [stageProof, setStageProof] = useState<CapturedProof | null>(null);
  const [finalKg, setFinalKg] = useState('');
  const [finalGrade, setFinalGrade] = useState('A');
  const [finalProof, setFinalProof] = useState<CapturedProof | null>(null);
  const [busy, setBusy] = useState(false);
  const [viewer, setViewer] = useState<{ uri: string; title: string; caption?: string } | null>(null);

  function watermarkMeta(weightKg: number, step: string) {
    return {
      timestampIso: new Date().toISOString(),
      latitude: gps?.latitude,
      longitude: gps?.longitude,
      weightKg,
      category: step,
      operatorId: operator?.id ?? '',
      stationLabel: activeSite?.name,
    };
  }

  const load = useCallback(async () => {
    if (!id || !token) return;
    try {
      const data = await getProcessingBatch(token, id);
      setBatch(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [id, token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleAddStage() {
    if (!token || !id) return;
    setBusy(true);
    setError(null);
    try {
      const proof = stageProof ? await uploadProofPhoto(token, 'processing', stageProof, id) : undefined;
      await addProcessingStage(token, id, { stage, notes: stageNotes || undefined, proof });
      setStageNotes('');
      setStageProof(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add stage.');
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    if (!token || !id) return;
    const parsed = parseWeightKg(finalKg);
    if (!parsed.ok) {
      setError(weightErrorMessage(parsed.reason));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const proof = finalProof ? await uploadProofPhoto(token, 'processing', finalProof, id) : undefined;
      await completeProcessing(token, id, {
        final_weight_grams: Math.round(parsed.kg * 1000),
        final_grade: finalGrade,
        proof,
      });
      setFinalProof(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete.');
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.center}><ActivityIndicator color={c.accentInk} /></View>
      </SafeAreaView>
    );
  }

  if (error && !batch) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={32} color={c.error} />
          <Text style={[styles.muted, { color: c.textMuted }]}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isInProgress = batch?.status === 'in_progress';

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
        <Text style={[styles.topTitle, { color: c.foreground }]}>Processing Batch</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Row label="Material" value={batch!.material.toUpperCase()} />
          <Row label="Initial" value={`${(batch!.initial_weight_grams / 1000).toFixed(1)} kg`} />
          {batch!.final_weight_grams != null && <Row label="Final" value={`${(batch!.final_weight_grams / 1000).toFixed(1)} kg`} />}
          {batch!.yield_percent != null && <Row label="Yield" value={`${batch!.yield_percent}%`} />}
          {batch!.final_grade && <Row label="Final Grade" value={batch!.final_grade} />}
          <Row label="Status" value={batch!.status.replace(/_/g, ' ')} />

          {batch!.intake_proof && (
            <ProofThumbRow
              label="Intake proof"
              uri={mediaUrl(batch!.intake_proof.storage_key)}
              onPress={() => setViewer({
                uri: mediaUrl(batch!.intake_proof!.storage_key),
                title: 'Intake proof',
                caption: `${(batch!.initial_weight_grams / 1000).toFixed(1)} kg in`,
              })}
            />
          )}
          {batch!.final_proof && (
            <ProofThumbRow
              label="Final proof"
              uri={mediaUrl(batch!.final_proof.storage_key)}
              onPress={() => setViewer({
                uri: mediaUrl(batch!.final_proof!.storage_key),
                title: 'Final weighing proof',
                caption: batch!.final_weight_grams != null
                  ? `${(batch!.final_weight_grams / 1000).toFixed(1)} kg out`
                  : undefined,
              })}
            />
          )}
        </View>

        {/* Stage history */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Stages</Text>
          {batch!.stages && batch!.stages.length > 0 ? (
            batch!.stages.map((s) => (
              <View key={s.id} style={styles.stageRow}>
                <Ionicons name="checkmark-circle" size={16} color={c.accentInk} />
                <Text style={[styles.stageText, { color: c.foreground }]}>{s.stage}</Text>
                {s.notes ? <Text style={[styles.stageNotes, { color: c.textMuted }]}>· {s.notes}</Text> : null}
                {s.proof && (
                  <TouchableOpacity
                    onPress={() => setViewer({
                      uri: mediaUrl(s.proof!.storage_key),
                      title: `${s.stage} proof`,
                      caption: new Date(s.recorded_at).toLocaleString(),
                    })}
                    activeOpacity={0.7}
                    accessibilityLabel={`View the proof photo for the ${s.stage} stage`}
                  >
                    <Image
                      source={{ uri: mediaUrl(s.proof.storage_key) }}
                      style={[styles.stageThumb, { borderColor: c.border }]}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text style={[styles.muted, { color: c.textMuted }]}>No stages recorded yet.</Text>
          )}
        </View>

        {isInProgress && (
          <>
            {/* Add stage */}
            <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Record Stage</Text>
              <View style={styles.chips}>
                {STAGES.map((s) => {
                  const active = s === stage;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, { borderColor: active ? c.accent : c.border, backgroundColor: active ? `${c.accent}18` : c.background }]}
                      onPress={() => setStage(s)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, { color: active ? c.accent : c.textSecondary }]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                value={stageNotes}
                onChangeText={setStageNotes}
                placeholder="Notes (optional)"
                placeholderTextColor={c.textFaint}
                style={[styles.notesInput, { color: c.foreground, borderColor: c.border, backgroundColor: c.background }]}
              />

              <ProofPhotoField
                label="Stage proof photo"
                hint={`Frame the material at the ${stage} stage`}
                helper="Photograph the material at this stage. Time, location and your operator ID are stamped onto the photo."
                proof={stageProof}
                onChange={setStageProof}
                // A stage is a checkpoint, not a weighing, so the batch's intake
                // weight is stamped for reference rather than a fresh reading.
                buildMeta={() => watermarkMeta(batch!.initial_weight_grams / 1000, `${stage.toUpperCase()} STAGE`)}
              />

              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: c.accentInk }]}
                onPress={handleAddStage}
                disabled={busy}
                activeOpacity={0.85}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={c.accentInk} />
                ) : (
                  <Text style={[styles.secondaryBtnLabel, { color: c.accentInk }]}>Add Stage</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Complete result */}
            <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Final Result</Text>
              <View style={[styles.inputRow, { borderColor: c.border, backgroundColor: c.background }]}>
                <TextInput
                  value={finalKg}
                  onChangeText={(t) => setFinalKg(sanitizeWeightInput(t))}
                  placeholder="0.0"
                  placeholderTextColor={c.textFaint}
                  keyboardType="decimal-pad"
                  style={[styles.input, { color: c.foreground }]}
                />
                <Text style={[styles.unit, { color: c.textSecondary }]}>kg</Text>
              </View>
              <View style={styles.chips}>
                {GRADES.map((g) => {
                  const active = g === finalGrade;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.chip, { borderColor: active ? c.accent : c.border, backgroundColor: active ? `${c.accent}18` : c.background }]}
                      onPress={() => setFinalGrade(g)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, { color: active ? c.accent : c.textSecondary }]}>Grade {g}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <ProofPhotoField
                label="Final weighing proof photo"
                hint="Frame the scale display and the processed output together"
                helper="Photograph the final weighing. The yield is calculated from this number, so it carries its own evidence."
                proof={finalProof}
                onChange={setFinalProof}
                buildMeta={() => {
                  const parsed = parseWeightKg(finalKg);
                  return parsed.ok ? watermarkMeta(parsed.kg, 'PROCESSING OUTPUT') : null;
                }}
                disabledReason="Enter the final weight first — it is stamped onto the photo."
              />

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: parseWeightKg(finalKg).ok ? c.accent : c.border }]}
                onPress={handleComplete}
                disabled={!parseWeightKg(finalKg).ok || busy}
                activeOpacity={0.85}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={c.accentContrast} />
                ) : (
                  <Text style={[styles.primaryBtnLabel, { color: parseWeightKg(finalKg).ok ? c.accentContrast : c.textMuted }]}>Complete Processing</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {error && batch && (
          <NoticeCard tone="danger">{error}</NoticeCard>
        )}
      </ScrollView>

      {viewer && (
        <PhotoLightbox
          uri={viewer.uri}
          title={viewer.title}
          caption={viewer.caption}
          onClose={() => setViewer(null)}
        />
      )}
    </SafeAreaView>
  );
}

function ProofThumbRow({ label, uri, onPress }: { label: string; uri: string; onPress: () => void }) {
  const c = useThemeColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: c.textMuted }]}>{label}</Text>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityLabel={`View the ${label.toLowerCase()} photo`}>
        <Image source={{ uri }} style={[styles.stageThumb, { borderColor: c.border }]} resizeMode="cover" />
      </TouchableOpacity>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: c.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: FontSize.lg, fontFamily: Font.bold },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  muted: { fontSize: FontSize.sm, fontFamily: Font.regular },
  content: { padding: 20, gap: 14, paddingBottom: 32 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  sectionTitle: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: FontSize.sm, fontFamily: Font.regular, flex: 1 },
  rowValue: { fontSize: FontSize.sm, fontFamily: Font.medium, flex: 2, textAlign: 'right' },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stageText: { fontSize: FontSize.sm, fontFamily: Font.semiBold, textTransform: 'capitalize' },
  stageThumb: { width: 30, height: 30, borderRadius: 8, borderWidth: 1 },
  stageNotes: { fontSize: FontSize.sm, fontFamily: Font.regular, flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: FontSize.sm, fontFamily: Font.semiBold, textTransform: 'capitalize' },
  notesInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 48, fontSize: FontSize.sm, fontFamily: Font.regular },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 56 },
  input: { flex: 1, fontSize: FontSize['2xl'], fontFamily: Font.bold },
  unit: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  secondaryBtn: { height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  primaryBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  errorCard: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 14, padding: 14, alignItems: 'flex-start' },
  errorText: { flex: 1, fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
});
