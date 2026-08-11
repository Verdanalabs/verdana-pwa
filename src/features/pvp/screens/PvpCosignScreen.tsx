import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { withAlpha, Alpha } from '@/src/shared/theme/color';
import { SkeletonBox } from '@/src/shared/ui/Skeleton';
import { CameraOverlay } from '@/src/shared/ui/CameraOverlay';
import { CarbonImpactBadge } from '@/src/shared/ui/CarbonImpactBadge';
import { NoticeCard } from '@/src/shared/ui/NoticeCard';
import { parseWeightKg, sanitizeWeightInput, weightErrorMessage, weightKgToGrams } from '@/src/shared/lib/weight';
import { dataUriToBlob, sha256HexOfDataUri, watermarkPhoto } from '@/src/shared/lib/photo-watermark';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { enqueueWeigh } from '@/src/features/pvp/state/pvp-weigh-queue';
import { createUploadUrl, getBatch, dispatchBatch, pvpWeighBatch, type ApiBatchDetail } from '@/src/features/batch/services/batch-api';
import { ApiError } from '@/src/shared/services/api';

import { runtimeConfig } from '@/src/shared/config/runtime-config';

const API_BASE = runtimeConfig.apiBaseUrl;

function mediaUrl(key: string) {
  return `${API_BASE}/v1/media/${key}`;
}

function formatMaterial(m: string) {
  return m.toUpperCase();
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

function PvpCosignSkeleton() {
  const c = useThemeColors();

  return (
    <>
      <View style={styles.topBar}>
        <View style={[styles.iconBtn, { backgroundColor: c.surface, borderColor: c.border }]} />
        <SkeletonBox width={120} height={20} radius={7} />
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.photoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={[styles.photo, { backgroundColor: c.border }]} />
          <View style={styles.photoFooter}>
            <SkeletonBox width={90} height={24} radius={8} />
            <SkeletonBox width={110} height={26} radius={13} />
          </View>
        </View>

        {[0, 1].map((section) => (
          <View key={section} style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <SkeletonBox width={110} height={16} radius={6} />
            {[0, 1, 2].map((row) => (
              <View key={row} style={styles.row}>
                <SkeletonBox width="32%" height={12} radius={6} />
                <SkeletonBox width="34%" height={14} radius={6} />
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </>
  );
}

type GpsFix = { latitude: number; longitude: number; accuracy: number };
type GpsState = 'acquiring' | 'ready' | 'denied' | 'unsupported';

interface ScaleProof {
  dataUri: string;
  sha256Hex: string;
  capturedAt: string;
}

export default function PvpCosignScreen() {
  const c = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, operator, activeSite } = usePvpAuth();

  const [batch, setBatch] = useState<ApiBatchDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [actualWeightKg, setActualWeightKg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [queuedOffline, setQueuedOffline] = useState(false);

  const [gps, setGps] = useState<GpsFix | null>(null);
  const [gpsState, setGpsState] = useState<GpsState>('acquiring');
  const [proof, setProof] = useState<ScaleProof | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    if (!id || !token) return;
    let cancelled = false;

    async function load() {
      try {
        const data = await getBatch(token!, id);
        if (!cancelled) setBatch(data);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load batch');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, token]);

  // The watermark burns the coordinates into the photo, so the fix has to exist
  // before the camera opens rather than being collected at submit time.
  const acquireGps = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsState('unsupported');
      setGpsError('This device cannot report a location. GPS is required to verify the pickup.');
      return;
    }

    setGpsState('acquiring');
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!pos.coords.latitude || !pos.coords.longitude) {
          setGpsState('denied');
          setGpsError('GPS coordinates came back invalid. Move outside and try again.');
          return;
        }
        setGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGpsState('ready');
      },
      () => {
        setGpsState('denied');
        setGpsError('Could not get your location. Allow location access — GPS is required to verify proximity with the collector.');
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }, []);

  useEffect(() => { acquireGps(); }, [acquireGps]);

  // A watermark that disagrees with the submitted weight is worse than no
  // watermark, so changing the weight invalidates the photo taken against it.
  function handleWeightChange(text: string) {
    const next = sanitizeWeightInput(text);
    setActualWeightKg(next);
    if (proof && next !== actualWeightKg) {
      setProof(null);
      setProofError('Weight changed — retake the proof photo so it matches.');
    }
  }

  async function processCapture(rawUri: string): Promise<string> {
    const parsed = parseWeightKg(actualWeightKg);
    if (!parsed.ok || !gps || !batch) {
      throw new Error('Enter the weight and wait for GPS before taking the proof photo.');
    }
    return watermarkPhoto(rawUri, {
      timestampIso: new Date().toISOString(),
      latitude: gps.latitude,
      longitude: gps.longitude,
      weightKg: parsed.kg,
      category: batch.material,
      operatorId: operator?.id ?? '',
      stationLabel: activeSite?.name,
    });
  }

  async function handleCaptured(watermarkedUri: string) {
    setIsCameraOpen(false);
    setProofError(null);
    try {
      const sha256Hex = await sha256HexOfDataUri(watermarkedUri);
      setProof({ dataUri: watermarkedUri, sha256Hex, capturedAt: new Date().toISOString() });
    } catch (e) {
      setProofError(e instanceof Error ? e.message : 'Could not fingerprint the proof photo. Retake it.');
    }
  }

  async function handleWeigh() {
    if (!batch || !token) return;

    const parsed = parseWeightKg(actualWeightKg);
    if (!parsed.ok) {
      setSubmitError(weightErrorMessage(parsed.reason));
      return;
    }
    const grams = weightKgToGrams(parsed.kg);

    if (!proof) {
      setProofError('A photo of the scale is required before you can submit the weight.');
      return;
    }
    if (!gps) {
      setGpsError('GPS is required for pickup verification. Enable location access and try again.');
      return;
    }

    const estimated = batch.estimated_weight_grams ?? 0;
    if (estimated > 0) {
      const diffPercent = Math.abs(((grams - estimated) / estimated) * 100);
      if (diffPercent > 50) {
        setSubmitError('Discrepancy is above 50%. This batch requires admin review before confirmation.');
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setGpsError(null);

    try {
      // Auto-dispatch if batch is still in 'accepted' status.
      if (batch.status === 'accepted') {
        try {
          await dispatchBatch(token, batch.id);
        } catch (dispatchErr) {
          // If dispatch fails with 409 (already dispatched), that's fine — continue to weigh.
          if (!(dispatchErr instanceof ApiError && dispatchErr.status === 409)) {
            throw dispatchErr;
          }
        }
      }

      // Presigned with the real batch id, which is also what the server checks
      // the returned storage key against.
      const upload = await createUploadUrl(token, {
        batch_id: batch.id,
        content_type: 'image/jpeg',
        filename: `scale-proof-${batch.id}.jpg`,
      });
      const putRes = await fetch(upload.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: dataUriToBlob(proof.dataUri),
      });
      if (!putRes.ok) {
        throw new Error(`Could not upload the proof photo (${putRes.status}).`);
      }

      await pvpWeighBatch(token, batch.id, {
        actual_weight_grams: grams,
        latitude: gps.latitude,
        longitude: gps.longitude,
        gps_accuracy_m: gps.accuracy,
        weighed_at: new Date().toISOString(),
        media: [{
          storage_key: upload.storage_key,
          media_kind: 'scale_proof',
          mime_type: 'image/jpeg',
          sha256_hex: proof.sha256Hex,
          captured_at: proof.capturedAt,
        }],
      });

      setDone(true);
    } catch (e) {
      // A network-level failure means the request never reached the API, so the
      // weighing is queued rather than lost. An ApiError means the server did
      // answer and rejected it, which queueing would only repeat.
      if (!(e instanceof ApiError)) {
        try {
          await enqueueWeigh({
            batchId: batch.id,
            actualWeightGrams: grams,
            latitude: gps.latitude,
            longitude: gps.longitude,
            gpsAccuracyM: gps.accuracy,
            weighedAt: new Date().toISOString(),
            photoDataUri: proof.dataUri,
            sha256Hex: proof.sha256Hex,
            photoCapturedAt: proof.capturedAt,
          });
          setQueuedOffline(true);
          setIsSubmitting(false);
          return;
        } catch (queueErr) {
          setSubmitError(queueErr instanceof Error ? queueErr.message : 'Could not save this weighing offline.');
          setIsSubmitting(false);
          return;
        }
      }
      setSubmitError(e instanceof Error ? e.message : 'Failed to submit weight. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Queued offline ─────────────────────────────────────────────────────────
  // Deliberately distinct from the submitted state: nothing has reached the API
  // yet, and telling the operator otherwise invites a second weighing.
  if (queuedOffline) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
        <View style={styles.successWrap}>
          <View style={[styles.successIcon, { backgroundColor: withAlpha(c.info, Alpha.subtle), borderColor: withAlpha(c.info, Alpha.medium) }]}>
            <Ionicons name="cloud-offline-outline" size={52} color={c.info} />
          </View>
          <Text style={[styles.successTitle, { color: c.foreground }]}>Saved offline</Text>
          <Text style={[styles.successSub, { color: c.textSecondary }]}>
            No connection right now. The weight and the proof photo are stored on this device and will upload
            automatically once you are back online.
          </Text>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: c.accent }]}
            onPress={() => router.replace('/(pvp-tabs)/dashboard')}
            activeOpacity={0.85}
          >
            <Text style={[styles.doneBtnLabel, { color: c.accentContrast }]}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top', 'bottom']}>
        <View style={styles.successWrap}>
          <View style={[styles.successIcon, { backgroundColor: `${c.accent}18`, borderColor: `${c.accent}25` }]}>
            <Ionicons name="checkmark-circle" size={52} color={c.accentInk} />
          </View>
          <Text style={[styles.successTitle, { color: c.foreground }]}>Weight Submitted!</Text>
          <Text style={[styles.successSub, { color: c.textSecondary }]}>
            Batch weighed successfully. Waiting for the supplier to approve the co-sign.
          </Text>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: c.accent }]}
            onPress={() => router.replace('/(pvp-tabs)/dashboard')}
            activeOpacity={0.85}
          >
            <Text style={[styles.doneBtnLabel, { color: c.accentContrast }]}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
        <PvpCosignSkeleton />
      </SafeAreaView>
    );
  }

  // ── Error / not found ──────────────────────────────────────────────────────
  if (loadError || !batch) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={36} color={c.error} />
          <Text style={[styles.errorTitle, { color: c.foreground }]}>Batch not found</Text>
          <Text style={[styles.errorSub, { color: c.textMuted }]}>{loadError ?? 'Check the QR code and try again.'}</Text>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={[styles.backBtnLabel, { color: c.foreground }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const photoMedia = batch.media.find((m) => m.media_kind === 'photo');
  const photoUri = photoMedia ? mediaUrl(photoMedia.storage_key) : null;
  const estimatedKg = batch.estimated_weight_grams != null
    ? (batch.estimated_weight_grams / 1000).toFixed(1)
    : '-';
  const parsedWeight = parseWeightKg(actualWeightKg);
  const weightError = actualWeightKg.trim() && !parsedWeight.ok ? weightErrorMessage(parsedWeight.reason) : null;
  const actualKgNumber = parsedWeight.ok ? parsedWeight.kg : NaN;
  const estimatedGrams = batch.estimated_weight_grams ?? 0;
  const actualGrams = parsedWeight.ok ? weightKgToGrams(parsedWeight.kg) : 0;
  const diffPercent = estimatedGrams > 0 && actualGrams > 0
    ? ((actualGrams - estimatedGrams) / estimatedGrams) * 100
    : null;
  const absDiffPercent = diffPercent == null ? 0 : Math.abs(diffPercent);
  const isHighDiscrepancy = absDiffPercent > 15;
  const isBlockedDiscrepancy = absDiffPercent > 50;
  const shortId = batch.id.slice(0, 8).toUpperCase();
  const alreadyCosigned = batch.status === 'cosigning' || batch.status === 'cosigned' || batch.status === 'minted' || batch.status === 'mint_pending' || batch.status === 'minting';

  // The photo has to carry the weight and the coordinates, so both must exist
  // before the camera is any use.
  const canCapture = parsedWeight.ok && gpsState === 'ready' && gps != null;
  const canSubmit = canCapture && proof != null && !isBlockedDiscrepancy;

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
        <Text style={[styles.topTitle, { color: c.foreground }]}>Co-sign Batch</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photo */}
        <View style={[styles.photoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={[styles.photo, { backgroundColor: c.border, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="image-outline" size={40} color={c.textMuted} />
            </View>
          )}
          <View style={styles.photoFooter}>
            <Text style={[styles.batchShortId, { color: c.foreground }]}>{shortId}</Text>
            <View style={[styles.statusPill, {
              backgroundColor: alreadyCosigned ? `${c.accent}18` : `${c.warning}20`,
              borderColor: alreadyCosigned ? `${c.accent}30` : `${c.warning}40`,
            }]}>
              <Text style={[styles.statusPillText, { color: alreadyCosigned ? c.accent : c.warning }]}>
                {alreadyCosigned ? 'Already co-signed' : 'Awaiting co-sign'}
              </Text>
            </View>
          </View>
        </View>

        {/* Batch info */}
        <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>Batch Info</Text>
          <Row label="Batch ID" value={batch.id} />
          <Row label="Material" value={formatMaterial(batch.material)} />
          <Row label="Estimated Weight" value={`${estimatedKg} kg`} />
          <Row label="Status" value={batch.status.replace(/_/g, ' ')} />
        </View>

        {/* Already co-signed notice */}
        {alreadyCosigned ? (
          <View style={[styles.noticeCard, { backgroundColor: `${c.accent}10`, borderColor: `${c.accent}20` }]}>
            <Ionicons name="information-circle-outline" size={18} color={c.accentInk} />
            <Text style={[styles.noticeText, { color: c.textSecondary }]}>
              This batch has already been co-signed and cannot be modified.
            </Text>
          </View>
        ) : (
          <>
            {/* Weight input */}
            <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Actual Weight</Text>
              <Text style={[styles.inputHint, { color: c.textMuted }]}>
                Weigh the batch and enter the confirmed weight below.
              </Text>
              <View style={[styles.inputRow, { borderColor: c.border, backgroundColor: c.background }]}> 
                <TextInput
                  value={actualWeightKg}
                  onChangeText={handleWeightChange}
                  placeholder="0.0"
                  placeholderTextColor={c.textFaint}
                  keyboardType="decimal-pad"
                  style={[styles.weightInput, { color: c.foreground }]}
                />
                <Text style={[styles.unitLabel, { color: c.textSecondary }]}>kg</Text>
              </View>
              {weightError && (
                <Text style={[styles.fieldError, { color: c.error }]}>{weightError}</Text>
              )}
              {diffPercent != null && (
                <View style={[
                  styles.discrepancyCard,
                  {
                    backgroundColor: isBlockedDiscrepancy ? c.toneBg.danger : isHighDiscrepancy ? c.toneBg.warning : withAlpha(c.accent, Alpha.subtle),
                    borderColor: isBlockedDiscrepancy ? c.toneFg.danger : isHighDiscrepancy ? c.toneFg.warning : withAlpha(c.accentInk, Alpha.medium),
                  },
                ]}>
                  <Ionicons
                    name={isBlockedDiscrepancy ? 'ban-outline' : isHighDiscrepancy ? 'warning-outline' : 'checkmark-circle-outline'}
                    size={17}
                    color={isBlockedDiscrepancy ? c.toneFg.danger : isHighDiscrepancy ? c.toneFg.warning : c.accentInk}
                  />
                  <Text style={[styles.discrepancyText, { color: isBlockedDiscrepancy ? c.toneFg.danger : isHighDiscrepancy ? c.toneFg.warning : c.textSecondary }]}>
                    Estimasi {estimatedKg} kg · Aktual {actualKgNumber.toFixed(1)} kg · Selisih {diffPercent > 0 ? '+' : ''}{diffPercent.toFixed(0)}%
                    {isBlockedDiscrepancy ? ' · Requires admin review' : isHighDiscrepancy ? ' · High discrepancy' : ''}
                  </Text>
                </View>
              )}

              <CarbonImpactBadge weightInput={actualWeightKg} material={batch.material} />
            </View>

            {/* Location — acquired up front because the watermark embeds it */}
            <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Location</Text>
              {gpsState === 'acquiring' && (
                <View style={styles.gpsRow}>
                  <ActivityIndicator size="small" color={c.accentInk} />
                  <Text style={[styles.gpsText, { color: c.textMuted }]}>Acquiring GPS fix…</Text>
                </View>
              )}
              {gpsState === 'ready' && gps && (
                <View style={styles.gpsRow}>
                  <Ionicons name="location" size={16} color={c.accentInk} />
                  <Text style={[styles.gpsText, { color: c.textSecondary }]}>
                    {gps.latitude.toFixed(5)}, {gps.longitude.toFixed(5)} · ±{Math.round(gps.accuracy)} m
                  </Text>
                </View>
              )}
              {(gpsState === 'denied' || gpsState === 'unsupported') && (
                <View style={styles.gpsRow}>
                  <Ionicons name="location-outline" size={16} color={c.error} />
                  <Text style={[styles.gpsText, { color: c.error, flex: 1 }]}>
                    {gpsState === 'unsupported'
                      ? 'This device cannot report a location.'
                      : 'Location unavailable. Allow location access to continue.'}
                  </Text>
                  {gpsState === 'denied' && (
                    <TouchableOpacity onPress={acquireGps} activeOpacity={0.7} hitSlop={8}>
                      <Text style={[styles.gpsRetry, { color: c.accentInk }]}>Retry</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Scale proof photo — mandatory dMRV evidence */}
            <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.foreground }]}>Scale Proof Photo</Text>

              {proof ? (
                <>
                  <Image source={{ uri: proof.dataUri }} style={styles.proofImage} resizeMode="cover" />
                  <View style={styles.proofFooter}>
                    <View style={[styles.proofPill, { backgroundColor: withAlpha(c.accent, Alpha.soft), borderColor: withAlpha(c.accentInk, Alpha.medium) }]}>
                      <Ionicons name="checkmark-circle" size={14} color={c.accentInk} />
                      <Text style={[styles.proofPillText, { color: c.accentInk }]}>Proof attached</Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsCameraOpen(true)} activeOpacity={0.7} hitSlop={8}>
                      <Text style={[styles.gpsRetry, { color: c.accentInk }]}>Retake</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={[styles.proofEmpty, { borderColor: c.borderStrong }]}>
                  <View style={[styles.proofIconWell, { backgroundColor: withAlpha(c.accent, Alpha.soft) }]}>
                    <Ionicons name="camera-outline" size={22} color={c.accentInk} />
                  </View>
                  <Text style={[styles.proofTitle, { color: c.foreground }]}>Photo of the scale is required</Text>
                  <Text style={[styles.proofBody, { color: c.textMuted }]}>
                    The scale reading and the waste pile must both be visible. Time, location, weight and your operator
                    ID are stamped onto the photo automatically.
                  </Text>
                  <TouchableOpacity
                    style={[styles.proofBtn, { backgroundColor: canCapture ? c.accent : c.border }]}
                    onPress={() => setIsCameraOpen(true)}
                    disabled={!canCapture}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="camera" size={18} color={canCapture ? c.accentContrast : c.textMuted} />
                    <Text style={[styles.proofBtnLabel, { color: canCapture ? c.accentContrast : c.textMuted }]}>
                      Take Proof Photo
                    </Text>
                  </TouchableOpacity>
                  {!canCapture && (
                    <Text style={[styles.proofHint, { color: c.textMuted }]}>
                      {!parsedWeight.ok
                        ? 'Enter the weight first — it is stamped onto the photo.'
                        : 'Waiting for a GPS fix.'}
                    </Text>
                  )}
                </View>
              )}

              {proofError && <NoticeCard tone="danger">{proofError}</NoticeCard>}
            </View>

            {submitError && <NoticeCard tone="danger">{submitError}</NoticeCard>}

            {gpsError && <NoticeCard tone="danger" icon="location-outline">{gpsError}</NoticeCard>}
          </>
        )}
      </ScrollView>

      {!alreadyCosigned && (
        <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
          {isSubmitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={c.accentInk} />
              <Text style={[styles.loadingText, { color: c.textSecondary }]}>Submitting weight...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.cosignBtn, { backgroundColor: canSubmit ? c.accent : c.border }]}
              onPress={handleWeigh}
              disabled={!canSubmit || isSubmitting}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={20} color={canSubmit ? c.accentContrast : c.textMuted} />
              <Text style={[styles.cosignBtnLabel, { color: canSubmit ? c.accentContrast : c.textMuted }]}>
                Tanda Tangan & Konfirmasi
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isCameraOpen && (
        <CameraOverlay
          hint="Frame the scale display and the waste pile together"
          processCapture={processCapture}
          onCapture={(uri) => { void handleCaptured(uri); }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  iconBtn: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: FontSize.lg, fontFamily: Font.bold },
  content: { padding: 20, gap: 14, paddingBottom: 24 },
  photoCard: { borderWidth: 1, borderRadius: 22, overflow: 'hidden' },
  photo: { width: '100%', height: 200 },
  photoFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  batchShortId: { fontSize: FontSize.xl, fontFamily: Font.bold },
  statusPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  statusPillText: { fontSize: FontSize.xs, fontFamily: Font.semiBold },
  infoCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  sectionTitle: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  rowLabel: { fontSize: FontSize.sm, fontFamily: Font.regular, flex: 1 },
  rowValue: { fontSize: FontSize.sm, fontFamily: Font.medium, flex: 2, textAlign: 'right' },
  inputHint: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20, marginTop: -4 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 16, height: 56,
  },
  weightInput: { flex: 1, fontSize: FontSize['2xl'], fontFamily: Font.bold },
  unitLabel: { fontSize: FontSize.lg, fontFamily: Font.semiBold },
  discrepancyCard: {
    flexDirection: 'row',
    gap: 9,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'flex-start',
  },
  discrepancyText: { flex: 1, fontSize: FontSize.sm, fontFamily: Font.medium, lineHeight: 20 },
  fieldError: { fontSize: FontSize.sm, fontFamily: Font.medium, lineHeight: 18, marginTop: -4 },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gpsText: { fontSize: FontSize.sm, fontFamily: Font.medium, lineHeight: 19 },
  gpsRetry: { fontSize: FontSize.sm, fontFamily: Font.semiBold },
  proofEmpty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  proofIconWell: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  proofTitle: { fontSize: FontSize.md, fontFamily: Font.semiBold, textAlign: 'center' },
  proofBody: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 19, textAlign: 'center' },
  proofBtn: {
    marginTop: 4,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 48, borderRadius: 14, paddingHorizontal: 20, alignSelf: 'stretch',
  },
  proofBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  proofHint: { fontSize: FontSize.xs, fontFamily: Font.regular, textAlign: 'center', lineHeight: 16 },
  proofImage: { width: '100%', height: 200, borderRadius: 14 },
  proofFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  proofPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  proofPillText: { fontSize: FontSize.xs, fontFamily: Font.semiBold },
  noticeCard: {
    flexDirection: 'row', gap: 10, borderWidth: 1,
    borderRadius: 14, padding: 14, alignItems: 'flex-start',
  },
  noticeText: { flex: 1, fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
  errorCard: {
    flexDirection: 'row', gap: 10, borderWidth: 1,
    borderRadius: 14, padding: 14, alignItems: 'flex-start',
  },
  errorCardText: { flex: 1, fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 20 },
  footer: {
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, borderTopWidth: 1,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 54 },
  loadingText: { fontSize: FontSize.md, fontFamily: Font.medium },
  cosignBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 54, borderRadius: 16, gap: 10,
  },
  cosignBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  // Success state
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 16 },
  successIcon: { width: 96, height: 96, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: FontSize['2xl'], fontFamily: Font.bold, textAlign: 'center' },
  successSub: { fontSize: FontSize.md, fontFamily: Font.regular, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  doneBtn: { marginTop: 8, height: 52, borderRadius: 16, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
  doneBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  // Error state
  errorTitle: { fontSize: FontSize.xl, fontFamily: Font.bold },
  errorSub: { fontSize: FontSize.md, fontFamily: Font.regular, textAlign: 'center', lineHeight: 22 },
  backBtn: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  backBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
});
