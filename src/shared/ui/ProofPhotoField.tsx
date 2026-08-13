import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { withAlpha, Alpha } from '@/src/shared/theme/color';
import { CameraOverlay } from '@/src/shared/ui/CameraOverlay';
import { NoticeCard } from '@/src/shared/ui/NoticeCard';
import { sha256HexOfDataUri, watermarkPhoto, type WatermarkMeta } from '@/src/shared/lib/photo-watermark';

export interface CapturedProof {
  dataUri: string;
  sha256Hex: string;
  capturedAt: string;
}

export interface ProofPhotoFieldProps {
  label: string;
  /** What the operator should frame. */
  hint: string;
  helper: string;
  proof: CapturedProof | null;
  onChange: (proof: CapturedProof | null) => void;
  /**
   * Metadata burned into the photo. Returning null means the form is not ready
   * — the weight has to exist before it can be stamped — and the camera stays
   * disabled with `disabledReason` shown.
   */
  buildMeta: () => WatermarkMeta | null;
  /** Copy explaining why the camera is disabled. Shown only while it is. */
  disabledReason?: string;
  optional?: boolean;
}

/**
 * Camera-backed proof photo for a logged weight.
 *
 * Shared because the organic feeding log, the harvest, and any later weighing
 * step all need the same thing: capture, burn in the dMRV watermark, hash the
 * result, and show what is attached. Empty, loading, filled and error are all
 * represented; the caller only holds the resulting proof.
 */
export function ProofPhotoField({
  label,
  hint,
  helper,
  proof,
  onChange,
  buildMeta,
  disabledReason,
  optional = true,
}: ProofPhotoFieldProps) {
  const c = useThemeColors();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // buildMeta returning null is the only thing that blocks capture: the weight
  // has to exist before it can be stamped. disabledReason is the copy shown
  // while that is true, not a second condition -- treating it as one left the
  // button permanently grey, since callers always pass it.
  const meta = buildMeta();
  const canCapture = meta != null;

  async function processCapture(rawUri: string): Promise<string> {
    const current = buildMeta();
    if (!current) throw new Error('Enter the weight before taking the proof photo.');
    return watermarkPhoto(rawUri, current);
  }

  async function handleCaptured(watermarkedUri: string) {
    setIsCameraOpen(false);
    setError(null);
    setIsProcessing(true);
    try {
      const sha256Hex = await sha256HexOfDataUri(watermarkedUri);
      onChange({ dataUri: watermarkedUri, sha256Hex, capturedAt: new Date().toISOString() });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not fingerprint the photo. Retake it.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text>
        {optional && <Text style={[styles.optional, { color: c.textFaint }]}>Optional</Text>}
      </View>

      {isProcessing ? (
        <View style={[styles.empty, { borderColor: c.border }]}>
          <ActivityIndicator size="small" color={c.accentInk} />
          <Text style={[styles.body, { color: c.textMuted }]}>Preparing proof photo…</Text>
        </View>
      ) : proof ? (
        <>
          <Image source={{ uri: proof.dataUri }} style={styles.image} resizeMode="cover" />
          <View style={styles.filledRow}>
            <View style={[styles.pill, { backgroundColor: withAlpha(c.accent, Alpha.soft), borderColor: withAlpha(c.accentInk, Alpha.medium) }]}>
              <Ionicons name="checkmark-circle" size={14} color={c.accentInk} />
              <Text style={[styles.pillText, { color: c.accentInk }]}>Proof attached</Text>
            </View>
            <View style={styles.filledActions}>
              <TouchableOpacity onPress={() => setIsCameraOpen(true)} activeOpacity={0.7} hitSlop={8}>
                <Text style={[styles.action, { color: c.accentInk }]}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onChange(null)} activeOpacity={0.7} hitSlop={8}>
                <Text style={[styles.action, { color: c.textMuted }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <View style={[styles.empty, { borderColor: c.borderStrong }]}>
          <View style={[styles.iconWell, { backgroundColor: withAlpha(c.accent, Alpha.soft) }]}>
            <Ionicons name="camera-outline" size={20} color={c.accentInk} />
          </View>
          <Text style={[styles.body, { color: c.textMuted }]}>{helper}</Text>
          <TouchableOpacity
            style={[styles.captureBtn, { backgroundColor: canCapture ? c.accent : c.border }]}
            onPress={() => setIsCameraOpen(true)}
            disabled={!canCapture}
            activeOpacity={0.85}
          >
            <Ionicons name="camera" size={17} color={canCapture ? c.accentContrast : c.textMuted} />
            <Text style={[styles.captureLabel, { color: canCapture ? c.accentContrast : c.textMuted }]}>
              Take Proof Photo
            </Text>
          </TouchableOpacity>
          {!canCapture && disabledReason && (
            <Text style={[styles.hintText, { color: c.textMuted }]}>{disabledReason}</Text>
          )}
        </View>
      )}

      {error && <NoticeCard tone="danger">{error}</NoticeCard>}

      {isCameraOpen && (
        <CameraOverlay
          hint={hint}
          processCapture={processCapture}
          onCapture={(uri) => { void handleCaptured(uri); }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: FontSize.sm, fontFamily: Font.regular },
  optional: { fontSize: FontSize.xs, fontFamily: Font.medium },
  empty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  iconWell: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  body: { fontSize: FontSize.sm, fontFamily: Font.regular, lineHeight: 19, textAlign: 'center' },
  captureBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 46, borderRadius: 13, alignSelf: 'stretch',
  },
  captureLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  hintText: { fontSize: FontSize.xs, fontFamily: Font.regular, textAlign: 'center', lineHeight: 16 },
  image: { width: '100%', height: 180, borderRadius: 14 },
  filledRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filledActions: { flexDirection: 'row', gap: 14 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  pillText: { fontSize: FontSize.xs, fontFamily: Font.semiBold },
  action: { fontSize: FontSize.sm, fontFamily: Font.semiBold },
});
