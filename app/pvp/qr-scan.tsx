import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Font, FontSize } from '@/constants/typography';
import { useThemeColors } from '@/store/theme-context';

type CameraState = 'idle' | 'requesting' | 'live' | 'error' | 'unsupported';

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

export default function PvpQrScanRoute() {
  const c = useThemeColors();
  const isWeb = Platform.OS === 'web';
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const scanTimerRef = useRef<number | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>(isWeb ? 'idle' : 'unsupported');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<string | null>(null);

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
    setCameraState('requesting');
    setCameraError(null);
    setScanResult(null);

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

    playVideo();
  }, [cameraState, isWeb]);

  useEffect(() => {
    if (!isWeb || cameraState !== 'live' || scanResult || !videoRef.current) {
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
          setScanResult(nextCode);
          setManualCode(nextCode);
          stopScannerLoop();
          return;
        }
      } catch {
        setCameraError((current) => current ?? 'Camera is active, but QR decoding failed on this browser.');
      }

      scanTimerRef.current = window.setTimeout(detect, 350);
    };

    detect();

    return () => {
      stopScannerLoop();
    };
  }, [cameraState, isWeb, scanResult, stopScannerLoop]);

  const primaryLabel =
    cameraState === 'requesting'
      ? 'Requesting camera access...'
      : cameraState === 'live'
        ? 'Camera is live'
        : 'Open camera for QR scan';

  const statusLabel =
    scanResult
      ? `Scanned code: ${scanResult}`
      : cameraError
        ? cameraError
        : cameraState === 'live'
          ? 'Point the QR code inside the frame.'
          : 'Use the live camera or enter the code manually.';

  const canUseCode = manualCode.trim().length > 0;

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
            {cameraState !== 'live' && (
              <Ionicons name="qr-code-outline" size={42} color={c.textMuted} />
            )}
            <Text style={[styles.scanHint, { color: c.textMuted }]}>
              {statusLabel}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary, { backgroundColor: c.accent }]}
          activeOpacity={0.85}
          onPress={startCamera}
        >
          <View style={[styles.actionBtnIcon, { backgroundColor: c.accentContrast + '20' }]}>
            <Ionicons name="camera-outline" size={16} color={c.accentContrast} />
          </View>
          <Text style={[styles.actionBtnText, { color: c.accentContrast }]}>
            {primaryLabel}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={c.accentContrast} />
        </TouchableOpacity>

        <View style={[styles.manualCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.manualLabel, { color: c.textSecondary }]}>Manual code</Text>
          <TextInput
            value={manualCode}
            onChangeText={setManualCode}
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
          >
            <Text style={[styles.manualSubmitText, { color: canUseCode ? c.background : c.textMuted }]}>
              Use this code
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  manualCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  manualLabel: {
    fontFamily: Font.medium,
    fontSize: FontSize.sm,
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
