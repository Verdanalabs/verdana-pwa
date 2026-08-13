import { createUploadUrl } from '@/src/features/batch/services/batch-api';
import { dataUriToBlob } from '@/src/shared/lib/photo-watermark';
import type { CapturedProof } from '@/src/shared/ui/ProofPhotoField';

/** Shape the API expects for an attached proof photo. */
export interface UploadedProof {
  storage_key: string;
  sha256_hex: string;
  captured_at?: string;
}

export type ProofKind = 'batch' | 'maggot' | 'processing';

/**
 * Put a captured proof photo in R2 and return what to send with the record.
 *
 * Called at submit rather than at capture, so a photo the operator retakes or
 * removes never reaches storage.
 *
 * `recordId` namespaces the key. Pass the record's own id where it exists; pass
 * nothing when the record is being created in the same request, and a fresh
 * uuid is generated instead — the server can only check the key's shape at that
 * point, since there is no id yet to tie it to.
 */
export async function uploadProofPhoto(
  token: string,
  kind: ProofKind,
  proof: CapturedProof,
  recordId?: string,
): Promise<UploadedProof> {
  const upload = await createUploadUrl(token, {
    batch_id: recordId ?? crypto.randomUUID(),
    kind,
    content_type: 'image/jpeg',
    filename: `${kind}-proof.jpg`,
  });

  const res = await fetch(upload.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: dataUriToBlob(proof.dataUri),
  });
  if (!res.ok) throw new Error(`Could not upload the proof photo (${res.status}).`);

  return {
    storage_key: upload.storage_key,
    sha256_hex: proof.sha256Hex,
    captured_at: proof.capturedAt,
  };
}
