/**
 * Photo proof processing for the dMRV weighing flow.
 *
 * The watermark is burned into the pixels, not drawn as UI on top of an image.
 * That is the whole point: the evidence has to survive being downloaded, sent
 * to an auditor, or opened from a block explorer, none of which carry the app's
 * layer stack with them.
 *
 * The colours below are literal because they are part of the image bitmap, not
 * part of the interface — they must stay legible over an arbitrary photograph
 * in either theme, so they cannot follow the theme tokens.
 */

const BAND_BACKGROUND = 'rgba(0, 0, 0, 0.62)';
const BAND_TEXT = '#FFFFFF';
const BAND_ACCENT = '#B5F23D';

/** Long edge after downscale. Enough to read a scale display, small enough to queue offline. */
export const PROOF_MAX_EDGE = 1280;
export const PROOF_JPEG_QUALITY = 0.8;

export interface WatermarkMeta {
  timestampIso: string;
  /** Omitted when no fix is available — the coordinate line is dropped rather than stamped as zeroes. */
  latitude?: number;
  longitude?: number;
  weightKg: number;
  /** What was weighed: a waste category, or a step such as ORGANIC FEEDING. */
  category: string;
  operatorId: string;
  stationLabel?: string;
}

function loadImage(dataUri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read the captured photo.'));
    img.src = dataUri;
  });
}

function scaledSize(width: number, height: number, maxEdge: number) {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const ratio = maxEdge / longest;
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

/**
 * Shrinks a capture to a sane size. A full 1920x1080 JPEG data URI is roughly
 * 400 KB of base64, and the offline queue lives in localStorage with a ~5 MB
 * budget shared across every queued item.
 */
export async function downscaleDataUri(
  dataUri: string,
  maxEdge = PROOF_MAX_EDGE,
  quality = PROOF_JPEG_QUALITY,
): Promise<string> {
  const img = await loadImage(dataUri);
  const { width, height } = scaledSize(img.naturalWidth, img.naturalHeight, maxEdge);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUri;

  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

function formatCoordinate(value: number): string {
  return Number.isFinite(value) ? value.toFixed(5) : '-';
}

function shortId(value: string): string {
  const cleaned = value.replace(/-/g, '').toUpperCase();
  return cleaned.length > 8 ? cleaned.slice(0, 8) : cleaned;
}

export function watermarkLines(meta: WatermarkMeta): string[] {
  const lines = [new Date(meta.timestampIso).toISOString()];

  // A missing fix drops the line. Stamping "0.00000, 0.00000" would read as a
  // real location in the Gulf of Guinea.
  if (meta.latitude != null && meta.longitude != null) {
    lines.push(`${formatCoordinate(meta.latitude)}, ${formatCoordinate(meta.longitude)}`);
  }

  lines.push(`${meta.weightKg.toFixed(2)} kg  ·  ${meta.category.toUpperCase()}`);

  const operator = `OP ${shortId(meta.operatorId)}`;
  lines.push(meta.stationLabel ? `${operator}  ·  ${meta.stationLabel}` : operator);
  return lines;
}

/**
 * Draws the dMRV proof band onto a capture and returns a new JPEG data URI.
 *
 * Type is sized from the image width so the band stays readable whether the
 * source came from a phone camera or a laptop webcam.
 */
export async function watermarkPhoto(dataUri: string, meta: WatermarkMeta): Promise<string> {
  const img = await loadImage(dataUri);
  const { width, height } = scaledSize(img.naturalWidth, img.naturalHeight, PROOF_MAX_EDGE);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare the proof photo on this device.');

  ctx.drawImage(img, 0, 0, width, height);

  const lines = watermarkLines(meta);
  const pad = Math.round(width * 0.028);
  const titleSize = Math.max(14, Math.round(width * 0.032));
  const lineSize = Math.max(11, Math.round(width * 0.024));
  const lineGap = Math.round(lineSize * 1.42);
  const bandHeight = pad * 2 + titleSize + Math.round(titleSize * 0.5) + lines.length * lineGap;

  ctx.fillStyle = BAND_BACKGROUND;
  ctx.fillRect(0, height - bandHeight, width, bandHeight);

  ctx.textBaseline = 'top';
  let y = height - bandHeight + pad;

  ctx.fillStyle = BAND_ACCENT;
  ctx.font = `700 ${titleSize}px sans-serif`;
  ctx.fillText('VERDANA dMRV PROOF', pad, y);
  y += titleSize + Math.round(titleSize * 0.5);

  ctx.fillStyle = BAND_TEXT;
  ctx.font = `500 ${lineSize}px sans-serif`;
  for (const line of lines) {
    ctx.fillText(line, pad, y);
    y += lineGap;
  }

  return canvas.toDataURL('image/jpeg', PROOF_JPEG_QUALITY);
}

function dataUriToBytes(dataUri: string): Uint8Array {
  const base64 = dataUri.slice(dataUri.indexOf(',') + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * SHA-256 of the watermarked bytes. This hash is submitted with the weighing,
 * re-derived server-side from the stored object, and ends up as the token's
 * "Proof Image Hash" attribute — so it must be taken over exactly the bytes
 * that get uploaded.
 */
export async function sha256HexOfDataUri(dataUri: string): Promise<string> {
  const bytes = dataUriToBytes(dataUri);
  const digest = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer);
  return bytesToHex(digest);
}

export function dataUriToBlob(dataUri: string, mimeType = 'image/jpeg'): Blob {
  return new Blob([dataUriToBytes(dataUri) as unknown as BlobPart], { type: mimeType });
}
