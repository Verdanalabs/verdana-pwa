import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Font, FontSize } from '@/src/shared/theme/typography';
import { useThemeColors } from '@/src/shared/theme/theme-context';
import { usePvpAuth } from '@/src/features/pvp/state/pvp-auth-context';
import { getBatch } from '@/src/features/batch/services/batch-api';
import { ApiError } from '@/src/shared/services/api';

type CameraState = 'idle' | 'requesting' | 'live' | 'error' | 'unsupported';
type VerificationState = 'idle' | 'verifying' | 'success' | 'error';

type BarcodeDetectorResult = {
  rawValue?: string;
};

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<BarcodeDetectorResult[]>;
};

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function extractBatchId(raw: string): string | null {
  const trimmed = raw.trim();
  if (UUID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed) as { batch_id?: string; type?: string };
    if (parsed?.batch_id && UUID_PATTERN.test(parsed.batch_id)) {
      return parsed.batch_id;
    }
  } catch {
    // Ignore malformed JSON payloads and fall back to invalid QR handling.
  }

  return null;
}

export default function PvpQrScanRoute() {
  const c = useThemeColors();
  const { token } = usePvpAuth();
  const isWeb = Platform.OS === 'web';
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>(isWeb ? 'idle' : 'unsupported');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [verificationState, setVerificationState] = useState<VerificationState>('idle');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationHint, setVerificationHint] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopScannerLoop = useCallback(() => {
    if (scanTimerRef.current !== null && typeof window !== 'undefined') {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    stopScannerLoop();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stopScannerLoop]);

  const resetVerification = useCallback(() => {
    setVerificationState('idle');
    setVerificationError(null);
    setVerificationHint(null);
    setScanResult(null);
  }, []);

  const verifyBatchAndNavigate = useCallback(async (rawPayload: string) => {
    const batchId = extractBatchId(rawPayload);

    if (!batchId) {
      setVerificationState('error');
      setVerificationError('QR payload is invalid. Scan a valid Verdana batch QR or paste a UUID.');
      return;
    }

    if (!token) {
      setVerificationState('error');
      setVerificationError('PVP session is missing. Please log in again.');
      return;
    }

    setVerificationState('verifying');
    setVerificationError(null);
    setVerificationHint('Verifying batch with backend...');
    setScanResult(batchId);

    try {
      const batch = await getBatch(token, batchId);

      if (batch.status !== 'accepted') {
        setVerificationState('error');
        setVerificationError(
          batch.status === 'pending'
            ? 'Batch is still pending. Accept it from the queue before doing physical handoff.'
            : batch.status === 'cosigning'
              ? 'Batch has already been weighed and is waiting for supplier approval.'
              : `Batch is not ready for weigh-in. Current status: ${batch.status}.`
        );
        return;
      }

      setVerificationState('success');
      setVerificationHint('Batch verified. Opening weigh screen...');
      stopCamera();
      router.replace(`/pvp/cosign?id=${batchId}` as never);
    } catch (error) {
      setVerificationState('error');

      if (error instanceof ApiError) {
        if (error.code === 'BATCH_NOT_FOUND') {
          setVerificationError('Batch not found. Check the QR code and try again.');
          return;
        }
        if (error.code === 'FORBIDDEN') {
          setVerificationError('This batch does not belong to your PVP site.');
          return;
        }
        setVerificationError(error.message);
        return;
      }

      setVerificationError(error instanceof Error ? error.message : 'Failed to verify batch.');
    }
  }, [stopCamera, token]);

  async function startCamera() {
    if (!isWeb) {
      setCameraState('unsupported');
      setCameraError('Camera preview is only enabled for the web mock flow right now.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unsupported');
      setCameraError('This browser does not support camera access.');
      return;
    }

    stopCamera();
    resetVerification();
    setManualOpen(false);
    setCameraState('requesting');
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraState('live');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to open the camera.';
      setCameraState('error');
      setCameraError(message);
      stopCamera();
    }
  }

  function handleBack() {
    stopCamera();

    if (typeof window !== 'undefined' && window.history.length <= 1) {
      router.replace('/(pvp-tabs)/dashboard' as never);
      return;
    }

    router.back();
  }

  function openManualEntry() {
    stopCamera();
    setCameraState('idle');
    resetVerification();
    setManualOpen(true);
  }

  function closeManualEntry() {
    setManualOpen(false);
  }

  function submitManualCode() {
    if (!canUseCode) return;
    setManualOpen(false);
    stopCamera();
    setCameraState('idle');
    void verifyBatchAndNavigate(manualCode.trim());
  }

  // ── Dev-only: decode QR from uploaded image file ────────────────────────────
  const handleDevFileUpload = useCallback(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    // Create or reuse a hidden file input
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    const input = fileInputRef.current;
    input.value = '';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      stopCamera();
      setCameraState('idle');
      resetVerification();
      setVerificationState('verifying');
      setVerificationHint('Decoding QR from uploaded image...');

      try {
        const bitmap = await createImageBitmap(file);

        if (typeof window.BarcodeDetector !== 'function') {
          setVerificationState('error');
          setVerificationError('BarcodeDetector API is not available in this browser. Try Chrome.');
          return;
        }

        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const results = await detector.detect(bitmap);
        const payload = results.find((r) => r.rawValue?.trim())?.rawValue?.trim();

        if (!payload) {
          setVerificationState('error');
          setVerificationError('No QR code found in the uploaded image. Try a clearer screenshot.');
          return;
        }

        await verifyBatchAndNavigate(payload);
      } catch (err) {
        setVerificationState('error');
        setVerificationError(err instanceof Error ? err.message : 'Failed to decode QR from image.');
      }
    };

    input.click();
  }, [stopCamera, resetVerification, verifyBatchAndNavigate]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (!isWeb || cameraState !== 'live' || !videoRef.current || !streamRef.current) {
      return;
    }

    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.muted = true;

    const playVideo = async () => {
      try {
        await video.play();
      } catch {
        setCameraError('Tap the preview button again if Safari blocked autoplay.');
      }
    };

    void playVideo();
  }, [cameraState, isWeb]);

  useEffect(() => {
    if (!isWeb || cameraState !== 'live' || verificationState === 'verifying' || verificationState === 'success' || verificationState === 'error' || !videoRef.current) {
      stopScannerLoop();
      return;
    }

    if (typeof window.BarcodeDetector !== 'function') {
      setCameraError((current) => current ?? 'Live camera is active, but QR decoding is not supported in this browser yet.');
      return;
    }

    detectorRef.current ??= new window.BarcodeDetector({ formats: ['qr_code'] });

    const detect = async () => {
      const video = videoRef.current;
      const detector = detectorRef.current;

      if (!video || !detector || video.readyState < 2) {
        scanTimerRef.current = window.setTimeout(detect, 350);
        return;
      }

      try {
        const results = await detector.detect(video);
        const nextCode = results.find((item) => item.rawValue?.trim())?.rawValue?.trim();

        if (nextCode) {
          stopCamera();
          setCameraState('idle');
          await verifyBatchAndNavigate(nextCode);
          return;
        }
      } catch {
        setCameraError((current) => current ?? 'Camera is active, but QR decoding failed on this browser.');
      }

      scanTimerRef.current = window.setTimeout(detect, 350);
    };

    void detect();

    return () => {
      stopScannerLoop();
    };
  }, [cameraState, isWeb, stopCamera, stopScannerLoop, verificationState, verifyBatchAndNavigate]);

  const primaryLabel =
    verificationState === 'error'
      ? 'Scan again'
      : cameraState === 'requesting'
      ? 'Requesting camera access...'
      : cameraState === 'live'
        ? 'Scanning...'
        : 'Open camera for QR scan';

  const statusLabel =
    verificationState === 'verifying'
      ? verificationHint ?? 'Verifying batch with backend...'
      : verificationState === 'error'
        ? verificationError ?? 'Batch verification failed.'
        : scanResult
          ? `Scanned code: ${scanResult}`
            : cameraError
              ? cameraError
              : cameraState === 'live'
                ? 'Point the QR code inside the frame.'
                : 'Open the live camera to scan the supplier QR.';

  const canUseCode = manualCode.trim().length > 0 && verificationState !== 'verifying';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={c.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.foreground }]}>QR SCANNER</Text>
        <View style={styles.backBtn} />
      </View>

      <Text style={[styles.subtitle, { color: c.textMuted }]}>
        Point your camera at the supplier&apos;s QR code to begin co-sign.
      </Text>

      <View style={styles.viewfinderWrap}>
        <View style={[styles.viewfinder, { borderColor: c.border, backgroundColor: c.surface }]}>
          {cameraState === 'live' && isWeb && createElement('video', {
            ref: (node: HTMLVideoElement | null) => {
              videoRef.current = node;
            },
            playsInline: true,
            autoPlay: true,
            muted: true,
            style: styles.cameraVideo,
          })}

          <View style={[styles.overlayScrim, { backgroundColor: cameraState === 'live' ? 'transparent' : c.surface }]} />
          <View style={[styles.corner, styles.topLeft, { borderColor: c.accent }]} />
          <View style={[styles.corner, styles.topRight, { borderColor: c.accent }]} />
          <View style={[styles.corner, styles.bottomLeft, { borderColor: c.accent }]} />
          <View style={[styles.corner, styles.bottomRight, { borderColor: c.accent }]} />
          <View style={[styles.scanLine, { backgroundColor: c.accent }]} />

          <View style={styles.centerHint}>
            {verificationState === 'verifying' ? (
              <Ionicons name="sync-outline" size={42} color={c.accent} />
            ) : cameraState !== 'live' ? (
              <Ionicons name="qr-code-outline" size={42} color={c.textMuted} />
            ) : null}

            <Text style={[
              styles.scanHint,
              { color: verificationState === 'error' ? c.error : verificationState === 'verifying' ? c.accent : c.textMuted },
            ]}>
              {statusLabel}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary, { backgroundColor: c.accent }]}
          activeOpacity={0.85}
          onPress={() => { void startCamera(); }}
          disabled={verificationState === 'verifying'}
        >
          <View style={[styles.actionBtnIcon, { backgroundColor: c.accentContrast + '20' }]}>
            <Ionicons name="camera-outline" size={16} color={c.accentContrast} />
          </View>
          <Text style={[styles.actionBtnText, { color: c.accentContrast }]}>
            {primaryLabel}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={c.accentContrast} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.manualFallbackBtn, { backgroundColor: c.surface, borderColor: c.border }]}
          activeOpacity={0.82}
          onPress={openManualEntry}
          disabled={verificationState === 'verifying'}
        >
          <Ionicons name="keypad-outline" size={18} color={c.textSecondary} />
          <Text style={[styles.manualFallbackText, { color: c.textSecondary }]}>
            Enter code manually
          </Text>
        </TouchableOpacity>

        {__DEV__ && isWeb && (
          <TouchableOpacity
            style={[styles.manualFallbackBtn, { backgroundColor: '#8b5cf610', borderColor: '#8b5cf640' }]}
            activeOpacity={0.82}
            onPress={handleDevFileUpload}
            disabled={verificationState === 'verifying'}
          >
            <Ionicons name="image-outline" size={18} color="#8b5cf6" />
            <Text style={[styles.manualFallbackText, { color: '#8b5cf6' }]}>
              DEV: Upload QR image
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        transparent
        visible={manualOpen}
        animationType="fade"
        onRequestClose={closeManualEntry}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeManualEntry}>
          <Pressable
            style={[styles.manualSheet, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => {}}
          >
            <View style={styles.manualSheetHeader}>
              <View>
                <Text style={[styles.manualTitle, { color: c.foreground }]}>Manual code</Text>
                <Text style={[styles.manualSub, { color: c.textMuted }]}>
                  Paste the supplier QR payload or batch UUID.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.manualCloseBtn, { backgroundColor: c.background }]}
                onPress={closeManualEntry}
                activeOpacity={0.75}
              >
                <Ionicons name="close" size={18} color={c.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              value={manualCode}
              onChangeText={(value) => {
                setManualCode(value);
                if (verificationState !== 'idle') {
                  resetVerification();
                }
              }}
              placeholder="Paste or type supplier QR payload"
              placeholderTextColor={c.textFaint}
              style={[styles.manualInput, { color: c.foreground, borderColor: c.border, backgroundColor: c.background }]}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.manualSubmit, { backgroundColor: canUseCode ? c.foreground : c.background }]}
              activeOpacity={0.85}
              disabled={!canUseCode}
              onPress={submitManualCode}
            >
              <Text style={[styles.manualSubmitText, { color: canUseCode ? c.background : c.textMuted }]}>
                Verify this code
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Font.bold,
    fontSize: FontSize.md,
    letterSpacing: 0.8,
  },
  subtitle: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    paddingHorizontal: 20,
    lineHeight: 20,
    marginBottom: 8,
  },
  viewfinderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  viewfinder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  cameraVideo: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  overlayScrim: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  centerHint: {
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 20 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 20 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 20 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 20 },
  scanLine: {
    position: 'absolute',
    width: '74%',
    height: 2,
    opacity: 0.7,
    borderRadius: 999,
  },
  scanHint: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  actionBtn: {
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 12,
  },
  actionBtnPrimary: {},
  actionBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
  },
  manualFallbackBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  manualFallbackText: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.46)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  manualSheet: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  manualSheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  manualTitle: {
    fontFamily: Font.bold,
    fontSize: FontSize.lg,
  },
  manualSub: {
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: 4,
  },
  manualCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualInput: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontFamily: Font.regular,
    fontSize: FontSize.sm,
  },
  manualSubmit: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualSubmitText: {
    fontFamily: Font.semiBold,
    fontSize: FontSize.sm,
  },
});
