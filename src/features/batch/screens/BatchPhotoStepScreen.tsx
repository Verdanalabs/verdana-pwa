import { useCallback, useEffect, useRef, useState } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/src/shared/ui/PrimaryButton';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useBatchDraft } from '@/src/features/batch/state/batch-draft-context';
import { useThemeColors } from '@/src/shared/theme/theme-context';

// ── Inline camera — just video feed, no overlays ─────────────────────────────

interface InlineCameraProps {
  captureRef: React.RefObject<(() => void) | null>;
  onPreviewReady: (uri: string) => void;
  onReadyChange: (ready: boolean) => void;
  previewUri: string | null;
}

function InlineCamera({ captureRef, onPreviewReady, onReadyChange, previewUri }: InlineCameraProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          onReadyChange(true);
        }
      } catch {
        setError('Camera access denied. Please allow camera permission.');
        onReadyChange(false);
      }
    }
    void startCamera();
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function capture() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const uri = canvas.toDataURL('image/jpeg', 0.85);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onPreviewReady(uri);
  }

  // Expose capture fn to parent
  useEffect(() => {
    captureRef.current = capture;
  });

  function restartCamera() {
    async function restart() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          onReadyChange(true);
        }
      } catch { setError('Could not restart camera.'); }
    }
    void restart();
  }

  // Re-start stream when previewUri is cleared (retake)
  useEffect(() => {
    if (!previewUri) restartCamera();
  }, [previewUri]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div style={cs.wrap}>
        <p style={cs.errorText}>{error}</p>
      </div>
    );
  }

  return (
    <div style={cs.wrap}>
      {previewUri
        ? <img src={previewUri} style={cs.media} alt="captured" />
        : <video ref={videoRef} style={cs.media} playsInline muted autoPlay />
      }
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

const cs: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%', height: '100%',
    objectFit: 'cover',
  },
  errorText: {
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    fontSize: 13,
    maxWidth: 260,
    margin: 0,
    padding: '0 16px',
  },
};

// ── Main screen ──────────────────────────────────────────────────────────────

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

export default function BatchPhotoRoute() {
  const c = useThemeColors();
  const { draft, setPhoto, resetDraft } = useBatchDraft();

  const captureRef                      = useRef<(() => void) | null>(null);
  const [cameraReady, setCameraReady]   = useState(false);
  const [previewUri, setPreviewUri]     = useState<string | null>(null);

  const hasPhoto = !!draft.photoUri;

  const handlePreviewReady = useCallback((uri: string) => {
    setPreviewUri(uri);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!previewUri) return;
    setPhoto({ photoUri: previewUri, capturedAt: new Date().toISOString() });
    setPreviewUri(null);
  }, [previewUri, setPhoto]);

  const handleRetake = useCallback(() => {
    setPreviewUri(null);
    setCameraReady(false);
  }, []);

  const handleReset = useCallback(() => {
    resetDraft();
    setPreviewUri(null);
    setCameraReady(false);
  }, [resetDraft]);

  // ── Dev-only: pick image from file system ─────────────────────────────────
  const handleDevFilePick = useCallback(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUri = reader.result as string;
        setPreviewUri(dataUri);
      };
      reader.readAsDataURL(file);
    };

    input.click();
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: c.surface, borderColor: c.border }]}
              onPress={() => { handleReset(); router.back(); }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={18} color={c.foreground} />
            </TouchableOpacity>
          </View>

          <StepHeader
            step="Step 1 of 4"
            title="Capture the batch photo."
            body="Take one clear photo of the waste/material so the batch is easy to identify before drop-off."
          />

          {/* Camera / preview card */}
          <View style={[styles.mediaCard, { borderColor: c.border }]}>
            {hasPhoto ? (
              <>
                <Image source={{ uri: draft.photoUri! }} style={styles.previewImage} contentFit="cover" />
                <View style={styles.previewMeta}>
                  <View style={[styles.metaPill, { backgroundColor: `${c.accent}16`, borderColor: `${c.accent}20` }]}>
                    <Ionicons name="checkmark-circle" size={14} color={c.accent} />
                    <Text style={[styles.metaPillText, { color: c.textSecondary }]}>Photo captured</Text>
                  </View>
                  {draft.capturedAt && (
                    <Text style={[styles.previewHint, { color: c.textMuted }]}>
                      {new Date(draft.capturedAt).toLocaleString('en-US', {
                        day: 'numeric', month: 'short',
                        hour: 'numeric', minute: '2-digit',
                      })}
                    </Text>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.cameraWrap}>
                <InlineCamera
                  captureRef={captureRef}
                  onPreviewReady={handlePreviewReady}
                  onReadyChange={setCameraReady}
                  previewUri={previewUri}
                />
              </View>
            )}
          </View>

          {/* Action buttons below card */}
          {!hasPhoto && (
            <View style={styles.actionRow}>
              {previewUri ? (
                /* Preview: retake or confirm */
                <>
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { backgroundColor: c.surface, borderColor: c.border }]}
                    onPress={handleRetake}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera-outline" size={18} color={c.foreground} />
                    <Text style={[styles.secondaryBtnLabel, { color: c.foreground }]}>Retake</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: c.foreground }]}
                    onPress={handleConfirm}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark" size={18} color={c.background} />
                    <Text style={[styles.primaryBtnLabel, { color: c.background }]}>Use Photo</Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* Live feed: capture button */
                <TouchableOpacity
                  style={[
                    styles.captureBtn,
                    { backgroundColor: cameraReady ? c.foreground : c.border },
                  ]}
                  onPress={() => captureRef.current?.()}
                  activeOpacity={0.85}
                  disabled={!cameraReady}
                >
                  <Ionicons name="camera" size={20} color={cameraReady ? c.background : c.textFaint} />
                  <Text style={[styles.captureBtnLabel, { color: cameraReady ? c.background : c.textFaint }]}>
                    Capture Photo
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Dev-only: file upload fallback */}
          {__DEV__ && !hasPhoto && !previewUri && Platform.OS === 'web' && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.captureBtn, { backgroundColor: '#8b5cf610', borderColor: '#8b5cf640', borderWidth: 1 }]}
                onPress={handleDevFilePick}
                activeOpacity={0.82}
              >
                <Ionicons name="image-outline" size={18} color="#8b5cf6" />
                <Text style={[styles.captureBtnLabel, { color: '#8b5cf6' }]}>
                  DEV: Upload from file
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>

        <View style={[styles.footer, { borderTopColor: c.border, backgroundColor: c.background }]}>
          <PrimaryButton
            label="Continue to Details"
            onPress={() => router.push('/batch/new/details')}
            disabled={!hasPhoto}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingBottom: 24 },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  iconButton: {
    width: 42, height: 42,
    borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20, paddingTop: 18, gap: 6,
  },
  stepText: { fontSize: FontSize.sm, fontFamily: Font.semiBold },
  title: { fontSize: FontSize['2xl'], fontFamily: Font.bold, lineHeight: 28 },
  body: { fontSize: FontSize.md, fontFamily: Font.regular, lineHeight: 22, maxWidth: 310 },

  mediaCard: {
    margin: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cameraWrap: { height: 340 },
  previewImage: { width: '100%', height: 320 },
  previewMeta: { padding: 14, gap: 8 },
  metaPill: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  metaPillText: { fontSize: FontSize.sm, fontFamily: Font.medium },
  previewHint: { fontSize: FontSize.sm, fontFamily: Font.regular },

  actionRow: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 10,
  },
  captureBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  captureBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  secondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },
  primaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnLabel: { fontSize: FontSize.md, fontFamily: Font.semiBold },

  footer: {
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, borderTopWidth: 1,
  },
});
