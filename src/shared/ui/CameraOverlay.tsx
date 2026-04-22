import { useEffect, useRef, useState } from 'react';

interface CameraOverlayProps {
  onCapture: (uri: string) => void;
  onClose: () => void;
}

export function CameraOverlay({ onCapture, onClose }: CameraOverlayProps) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const animRef    = useRef<number | null>(null);

  const [error, setError]           = useState<string | null>(null);
  const [ready, setReady]           = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [scanY, setScanY]           = useState(0);

  // ── Start camera ──────────────────────────────────────────────────────────
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
          setReady(true);
        }
      } catch {
        setError('Camera access denied. Please allow camera permission in your browser.');
      }
    }
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ── Scan line animation ───────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || previewUri) return;
    let start: number | null = null;
    const duration = 2000;

    function animate(ts: number) {
      if (!start) start = ts;
      const elapsed = (ts - start) % (duration * 2);
      const progress = elapsed < duration
        ? elapsed / duration
        : 1 - (elapsed - duration) / duration;
      setScanY(progress);
      animRef.current = requestAnimationFrame(animate);
    }

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [ready, previewUri]);

  // ── Capture ───────────────────────────────────────────────────────────────
  function capture() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    const uri = canvas.toDataURL('image/jpeg', 0.85);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setPreviewUri(uri);
  }

  function retake() {
    setPreviewUri(null);
    setReady(false);

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
          setReady(true);
        }
      } catch {
        setError('Could not restart camera.');
      }
    }
    restart();
  }

  function confirmCapture() {
    if (previewUri) onCapture(previewUri);
  }

  // ── Viewfinder dimensions ─────────────────────────────────────────────────
  const VF_SIZE    = 260;
  const CORNER_LEN = 28;
  const CORNER_W   = 3;
  const CORNER_R   = 10;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={s.overlay}>
      {/* Error state */}
      {error && (
        <div style={s.errorBox}>
          <p style={s.errorText}>{error}</p>
          <button style={s.btn} onClick={onClose}>Close</button>
        </div>
      )}

      {/* Camera live / preview */}
      {!error && (
        <>
          {previewUri ? (
            <img src={previewUri} style={s.previewImg} alt="captured" />
          ) : (
            <video ref={videoRef} style={s.video} playsInline muted autoPlay />
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Dark overlay with viewfinder cutout */}
          {!previewUri && (
            <div style={s.vfOverlay}>
              {/* Top dark region */}
              <div style={{ ...s.darkRegion, top: 0, left: 0, right: 0, height: `calc(50% - ${VF_SIZE / 2}px)` }} />
              {/* Bottom dark region */}
              <div style={{ ...s.darkRegion, bottom: 0, left: 0, right: 0, height: `calc(50% - ${VF_SIZE / 2}px)` }} />
              {/* Left dark region */}
              <div style={{
                ...s.darkRegion,
                top: `calc(50% - ${VF_SIZE / 2}px)`,
                left: 0,
                width: `calc(50% - ${VF_SIZE / 2}px)`,
                height: VF_SIZE,
              }} />
              {/* Right dark region */}
              <div style={{
                ...s.darkRegion,
                top: `calc(50% - ${VF_SIZE / 2}px)`,
                right: 0,
                width: `calc(50% - ${VF_SIZE / 2}px)`,
                height: VF_SIZE,
              }} />

              {/* Viewfinder frame (corners only) */}
              <div style={{
                position: 'absolute',
                width: VF_SIZE,
                height: VF_SIZE,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}>
                {/* Top-left */}
                <div style={{ ...s.corner, top: 0, left: 0, borderTop: `${CORNER_W}px solid #fff`, borderLeft: `${CORNER_W}px solid #fff`, borderTopLeftRadius: CORNER_R, width: CORNER_LEN, height: CORNER_LEN }} />
                {/* Top-right */}
                <div style={{ ...s.corner, top: 0, right: 0, borderTop: `${CORNER_W}px solid #fff`, borderRight: `${CORNER_W}px solid #fff`, borderTopRightRadius: CORNER_R, width: CORNER_LEN, height: CORNER_LEN }} />
                {/* Bottom-left */}
                <div style={{ ...s.corner, bottom: 0, left: 0, borderBottom: `${CORNER_W}px solid #fff`, borderLeft: `${CORNER_W}px solid #fff`, borderBottomLeftRadius: CORNER_R, width: CORNER_LEN, height: CORNER_LEN }} />
                {/* Bottom-right */}
                <div style={{ ...s.corner, bottom: 0, right: 0, borderBottom: `${CORNER_W}px solid #fff`, borderRight: `${CORNER_W}px solid #fff`, borderBottomRightRadius: CORNER_R, width: CORNER_LEN, height: CORNER_LEN }} />

                {/* Scan line */}
                {ready && (
                  <div style={{
                    position: 'absolute',
                    left: 8,
                    right: 8,
                    top: scanY * (VF_SIZE - 4),
                    height: 2.5,
                    borderRadius: 99,
                    background: 'linear-gradient(90deg, transparent, #4ade80, #4ade80, transparent)',
                    boxShadow: '0 0 8px 2px rgba(74,222,128,0.5)',
                  }} />
                )}
              </div>
            </div>
          )}

          {/* Top bar */}
          <div style={s.topBar}>
            <button style={s.iconBtn} onClick={onClose}>
              <span style={s.iconText}>✕</span>
            </button>
          </div>

          {/* Hint text */}
          {!previewUri && (
            <div style={s.hintWrap}>
              <p style={s.hintText}>Position the material clearly in the frame</p>
            </div>
          )}

          {/* Bottom action */}
          <div style={s.bottomBar}>
            {previewUri ? (
              /* Preview actions */
              <div style={s.previewActions}>
                <button style={s.retakeBtn} onClick={retake}>Retake</button>
                <button style={s.confirmBtn} onClick={confirmCapture}>Use Photo</button>
              </div>
            ) : (
              /* Capture button */
              <button
                style={{ ...s.captureBtn, opacity: ready ? 1 : 0.5 }}
                onClick={capture}
                disabled={!ready}
              >
                <div style={s.captureBtnInner} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#000',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  video: {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%', height: '100%',
    objectFit: 'cover',
  },
  previewImg: {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%', height: '100%',
    objectFit: 'cover',
  },
  vfOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1,
  },
  darkRegion: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.60)',
  },
  corner: {
    position: 'absolute',
  },
  topBar: {
    position: 'absolute',
    top: 20, left: 20,
    zIndex: 10,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    border: '1.5px solid rgba(255,255,255,0.25)',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  iconText: { color: '#fff', fontSize: 18, lineHeight: '1' },
  hintWrap: {
    position: 'absolute',
    top: '50%',
    marginTop: -180,
    zIndex: 2,
    paddingHorizontal: 32,
    textAlign: 'center',
  } as React.CSSProperties,
  hintText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    textShadow: '0 1px 4px rgba(0,0,0,0.6)',
    margin: 0,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 52,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    paddingLeft: 32,
    paddingRight: 32,
    boxSizing: 'border-box',
  },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    border: '3.5px solid #fff',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.1s',
  },
  captureBtnInner: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#fff',
  },
  previewActions: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retakeBtn: {
    flex: 1,
    padding: '14px 0',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    border: '1.5px solid rgba(255,255,255,0.35)',
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    cursor: 'pointer',
  } as React.CSSProperties,
  confirmBtn: {
    flex: 1,
    padding: '14px 0',
    borderRadius: 16,
    backgroundColor: '#4ade80',
    border: 'none',
    color: '#0a1a0a',
    fontSize: 16,
    fontWeight: '700',
    cursor: 'pointer',
  } as React.CSSProperties,
  errorBox: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 16, padding: 24, zIndex: 10,
  },
  errorText: {
    color: '#fff', textAlign: 'center', fontSize: 16, maxWidth: 280, margin: 0,
  },
  btn: {
    padding: '10px 24px', borderRadius: 12,
    backgroundColor: '#fff', border: 'none',
    cursor: 'pointer', fontSize: 16, fontWeight: '600',
  },
};
