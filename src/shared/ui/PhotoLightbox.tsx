import { useEffect } from 'react';
import { Modal } from 'react-native';
import { DarkColors } from '@/src/shared/theme/tokens';

/** Always a dark chrome regardless of app theme, like the camera viewfinder. */
const t = DarkColors;

export interface PhotoLightboxProps {
  uri: string;
  /** Shown above the image: what this photo is evidence of. */
  title?: string;
  /** Shown below it: when it was taken, what it weighed. */
  caption?: string;
  onClose: () => void;
}

/**
 * Full-screen viewer for a proof photo.
 *
 * A watermark is only useful if it can be read, and the thumbnails these open
 * from are far too small for the burned-in band. Wrapped in a Modal for the
 * same reason as the camera: `position: fixed` resolves against the nearest
 * transformed ancestor, and React Native Web puts transforms on scroll
 * containers, which would trap this inside the row that opened it.
 */
export function PhotoLightbox({ uri, title, caption, onClose }: PhotoLightboxProps) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <div style={s.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label={title ?? 'Proof photo'}>
        <button style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        {title && <p style={s.title}>{title}</p>}

        {/* Stop a click on the image itself from dismissing. */}
        <img src={uri} style={s.image} alt={title ?? 'Proof photo'} onClick={(e) => e.stopPropagation()} />

        {caption && <p style={s.caption}>{caption}</p>}
      </div>
    </Modal>
  );
}

const s: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.92)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 20,
    boxSizing: 'border-box',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 14,
    border: `1px solid ${t.border}`,
    backgroundColor: t.surface,
    color: t.foreground,
    fontSize: 16,
    cursor: 'pointer',
  },
  title: {
    margin: 0,
    color: t.foreground,
    fontSize: 15,
    fontWeight: 600,
    textAlign: 'center',
  },
  image: {
    maxWidth: '100%',
    // Leaves room for the title and caption so neither is pushed off-screen.
    maxHeight: '72vh',
    objectFit: 'contain',
    borderRadius: 14,
  },
  caption: {
    margin: 0,
    color: t.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
};
