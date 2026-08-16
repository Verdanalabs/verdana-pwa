import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { addFeeding, addHarvest, getMaggotBatch, type MaggotBatch, type ProofPhoto } from '@/src/features/maggot/services/maggot-api';
import { ProofPhotoField, type CapturedProof } from '@/src/shared/ui/ProofPhotoField';
import { NoticeCard } from '@/src/shared/ui/NoticeCard';
import { PhotoLightbox } from '@/src/shared/ui/PhotoLightbox';
import type { WatermarkMeta } from '@/src/shared/lib/photo-watermark';
import { uploadProofPhoto } from '@/src/shared/lib/upload-proof';
import { parseWeightKg, sanitizeWeightInput, weightErrorMessage } from '@/src/shared/lib/weight';
import { useBestEffortGps } from '@/src/shared/hooks/useBestEffortGps';
import { useCo2Factors } from '@/src/shared/hooks/useCo2Factors';
import { computeOffsetKg, factorFor, formatOffsetKg } from '@/src/shared/lib/carbon';
import { runtimeConfig } from '@/src/shared/config/runtime-config';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function mediaUrl(storageKey: string) {
  return `${runtimeConfig.apiBaseUrl}/v1/media/${storageKey}`;
}

export default function MaggotBatchScreen() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, operator, activeSite } = usePvpAuth();
  const gps = useBestEffortGps();
  const { factors } = useCo2Factors();

  const [batch, setBatch] = useState<MaggotBatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fedOn, setFedOn] = useState(today());
  const [feedKg, setFeedKg] = useState('');
  const [maggotKg, setMaggotKg] = useState('');
  const [frassKg, setFrassKg] = useState('');
  const [feedProof, setFeedProof] = useState<CapturedProof | null>(null);
  const [harvestProof, setHarvestProof] = useState<CapturedProof | null>(null);
  const [busy, setBusy] = useState(false);
  // The open proof photo. A watermark that cannot be read is not evidence, and
  // the thumbnails are far too small for the burned-in band.
  const [viewer, setViewer] = useState<{ uri: string; title: string; caption?: string } | null>(null);

  function watermarkMeta(weightKg: number, step: string): WatermarkMeta {
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

  // Uploaded only on submit, so a photo the operator retakes or removes never
  // reaches R2.
  function uploadProof(proof: CapturedProof): Promise<ProofPhoto> {
    return uploadProofPhoto(token!, 'maggot', proof, id);
  }

  const load = useCallback(async () => {
    if (!id || !token) return;
    try {
      const data = await getMaggotBatch(token, id);
      setBatch(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [id, token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleAddFeeding() {
    if (!token || !id) return;
    const parsed = parseWeightKg(feedKg);
    if (!parsed.ok) { setError(weightErrorMessage(parsed.reason)); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fedOn)) { setError('Date must be YYYY-MM-DD.'); return; }
    setBusy(true);
    setError(null);
    try {
      const proof = feedProof ? await uploadProof(feedProof) : undefined;
      await addFeeding(token, id, {
        fed_on: fedOn,
        quantity_grams: Math.round(parsed.kg * 1000),
        proof,
      });
      setFeedKg('');
      setFeedProof(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add feeding.');
    } finally {
      setBusy(false);
    }
  }

  async function handleHarvest() {
    if (!token || !id) return;
    // Either weight may legitimately be zero — a run can yield frass and no
    // usable maggot — so an empty field reads as zero rather than an error.
    const maggot = maggotKg.trim() ? parseWeightKg(maggotKg) : ({ ok: true, kg: 0 } as const);
    const frass = frassKg.trim() ? parseWeightKg(frassKg) : ({ ok: true, kg: 0 } as const);
    if (!maggot.ok) { setError(`Maggot weight: ${weightErrorMessage(maggot.reason)}`); return; }
    if (!frass.ok) { setError(`Frass weight: ${weightErrorMessage(frass.reason)}`); return; }

    setBusy(true);
    setError(null);
    try {
      const proof = harvestProof ? await uploadProof(harvestProof) : undefined;
      await addHarvest(token, id, {
        maggot_weight_grams: Math.round(maggot.kg * 1000),
        frass_weight_grams: Math.round(frass.kg * 1000),
        proof,
      });
      setHarvestProof(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record harvest.');
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

  const harvested = !!batch?.harvest;

  // Emissions avoided by diverting this intake from landfill. Calculated from
  // the organic factor, the same table core-api uses when it mints, so the
  // figure here and the one on the token agree.
  const organicFactor = factorFor(factors, 'organic');
  const carbonAvoidedKg =
    batch && organicFactor
      ? computeOffsetKg(batch.organic_weight_grams / 1000, organicFactor)
      : null;

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
        <Text style={[styles.topTitle, { color: c.foreground }]}>Maggot Batch</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Row label="Organic input" value={`${(batch!.organic_weight_grams / 1000).toFixed(1)} kg`} />
          {carbonAvoidedKg != null && (
            <Row label="Carbon avoided" value={`${formatOffsetKg(carbonAvoidedKg)} kg CO2e`} />
          )}
          <Row label="Status" value={harvested ? 'harvested' : 'feeding'} />
          {batch!.harvest && <Row label="Maggot" value={`${(batch!.harvest.maggot_weight_grams / 1000).toFixed(1)} kg`} />}
          {batch!.harvest && <Row label="Frass" value={`${(batch!.harvest.frass_weight_grams / 1000).toFixed(1)} kg`} />}
          {batch!.yield_percent != null && <Row label="Yield" value={`${batch!.yield_percent}%`} />}
          {batch!.proof && (
            <>
              <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Intake proof photo</Text>
              <TouchableOpacity
                onPress={() => setViewer({
                  uri: mediaUrl(batch!.proof!.storage_key),
                  title: 'Intake proof',
                  caption: `${(batch!.organic_weight_grams / 1000).toFixed(1)} kg organic in`,
                })}
                activeOpacity={0.85}
                accessibilityLabel="View the intake proof photo"
              >
                <Image source={{ uri: mediaUrl(batch!.proof.storage_key) }} style={styles.proofImage} resizeMode="cover" />
              </TouchableOpacity>
            </>
          )}
          {batch!.harvest?.proof && (
            <>
              <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Harvest proof photo</Text>
              <TouchableOpacity
                onPress={() => setViewer({
                  uri: mediaUrl(batch!.harvest!.proof!.storage_key),
                  title: 'Harvest proof',
                  caption: `${(batch!.harvest!.maggot_weight_grams / 1000).toFixed(1)} kg maggot · ${(batch!.harvest!.frass_weight_grams / 1000).toFixed(1)} kg frass`,
                })}
                activeOpacity={0.85}
                accessibilityLabel="View the harvest proof photo"
              >
                <Image source={{ uri: mediaUrl(batch!.harvest.proof.storage_key) }} style={styles.proofImage} resizeMode="cover" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Feeding history */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Feeding Logs</Text>
          {batch!.feedings && batch!.feedings.length > 0 ? (
            batch!.feedings.map((f) => (
              <View key={f.id} style={styles.row}>
                <Text style={[styles.rowLabel, { color: c.textMuted }]}>{f.fed_on}</Text>
                <View style={styles.logValueRow}>
                  {f.proof && (
                    <TouchableOpacity
                      onPress={() => setViewer({
                        uri: mediaUrl(f.proof!.storage_key),
                        title: `Feeding proof · ${f.fed_on}`,
                        caption: `${(f.quantity_grams / 1000).toFixed(1)} kg fed`,
                      })}
                      activeOpacity={0.7}
                      accessibilityLabel={`View the proof photo for the feeding on ${f.fed_on}`}
                    >
                      <Image
                        source={{ uri: mediaUrl(f.proof.storage_key) }}
                        style={[styles.logThumb, { borderColor: c.border }]}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  )}
                  <Text style={[styles.logValue, { color: c.foreground }]}>{(f.quantity_grams / 1000).toFixed(1)} kg</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.muted, { color: c.textMuted }]}>No feedings recorded yet.</Text>
          )}
        </View>

        {!harvested && (
          <>
            {/* Add feeding */}
            <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Log Feeding</Text>
              <TextInput
                value={fedOn}
                onChangeText={setFedOn}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={c.textFaint}
                style={[styles.textInput, { color: c.foreground, borderColor: c.border, backgroundColor: c.background }]}
              />
              <View style={[styles.inputRow, { borderColor: c.border, backgroundColor: c.background }]}>
                <TextInput
                  value={feedKg}
                  onChangeText={(t) => setFeedKg(sanitizeWeightInput(t))}
                  placeholder="0.0"
                  placeholderTextColor={c.textFaint}
                  keyboardType="decimal-pad"
                  style={[styles.input, { color: c.foreground }]}
                />
                <Text style={[styles.unit, { color: c.textSecondary }]}>kg</Text>
              </View>

              <ProofPhotoField
                label="Scale proof photo"
                hint="Frame the scale display and the organic feed together"
                helper="Photograph the scale reading. Time, location, quantity and your operator ID are stamped onto the photo."
                proof={feedProof}
                onChange={setFeedProof}
                buildMeta={() => {
                  const parsed = parseWeightKg(feedKg);
                  return parsed.ok ? watermarkMeta(parsed.kg, 'ORGANIC FEEDING') : null;
                }}
                disabledReason="Enter the feeding quantity first — it is stamped onto the photo."
              />

              <TouchableOpacity
                style={[styles.secondaryBtn, { borderColor: c.accentInk }]}
                onPress={handleAddFeeding}
                disabled={busy}
                activeOpacity={0.85}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={c.accentInk} />
                ) : (
                  <Text style={[styles.secondaryBtnLabel, { color: c.accentInk }]}>Add Feeding</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Harvest */}
            <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Harvest</Text>
              <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Maggot weight</Text>
              <View style={[styles.inputRow, { borderColor: c.border, backgroundColor: c.background }]}>
                <TextInput
                  value={maggotKg}
                  onChangeText={setMaggotKg}
                  placeholder="0.0"
                  placeholderTextColor={c.textFaint}
                  keyboardType="decimal-pad"
                  style={[styles.input, { color: c.foreground }]}
                />
                <Text style={[styles.unit, { color: c.textSecondary }]}>kg</Text>
              </View>
              <Text style={[styles.fieldLabel, { color: c.textMuted }]}>Frass weight</Text>
              <View style={[styles.inputRow, { borderColor: c.border, backgroundColor: c.background }]}>
                <TextInput
                  value={frassKg}
                  onChangeText={(t) => setFrassKg(sanitizeWeightInput(t))}
                  placeholder="0.0"
                  placeholderTextColor={c.textFaint}
                  keyboardType="decimal-pad"
                  style={[styles.input, { color: c.foreground }]}
                />
                <Text style={[styles.unit, { color: c.textSecondary }]}>kg</Text>
              </View>

              <ProofPhotoField
                label="Scale proof photo"
                hint="Frame the scale display and the harvested maggot together"
                helper="Photograph the final weighing. Time, location, weight and your operator ID are stamped onto the photo."
                proof={harvestProof}
                onChange={setHarvestProof}
                buildMeta={() => {
                  const parsed = parseWeightKg(maggotKg.trim() ? maggotKg : frassKg);
                  return parsed.ok ? watermarkMeta(parsed.kg, 'ORGANIC HARVEST') : null;
                }}
                disabledReason="Enter the harvest weight first — it is stamped onto the photo."
              />

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: maggotKg.trim() || frassKg.trim() ? c.accent : c.border }]}
                onPress={handleHarvest}
                disabled={(!maggotKg.trim() && !frassKg.trim()) || busy}
                activeOpacity={0.85}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={c.accentContrast} />
                ) : (
                  <Text style={[styles.primaryBtnLabel, { color: maggotKg.trim() || frassKg.trim() ? c.accentContrast : c.textMuted }]}>Record Harvest</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {error && batch && <NoticeCard tone="danger">{error}</NoticeCard>}
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
  fieldLabel: { fontSize: FontSize.sm, fontFamily: Font.regular, marginBottom: -6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: FontSize.sm, fontFamily: Font.regular, flex: 1 },
  rowValue: { fontSize: FontSize.sm, fontFamily: Font.medium, flex: 2, textAlign: 'right' },
  logValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flex: 2 },
  logValue: { fontSize: FontSize.sm, fontFamily: Font.medium, textAlign: 'right' },
  logThumb: { width: 30, height: 30, borderRadius: 8, borderWidth: 1 },
  proofImage: { width: '100%', height: 180, borderRadius: 14 },
  textInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 48, fontSize: FontSize.md, fontFamily: Font.medium },
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
