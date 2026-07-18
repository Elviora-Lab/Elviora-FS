import { nanoid } from 'nanoid';
import sharp from 'sharp';
import { z } from 'zod';

import { requireAdmin, requireUser } from '@/server/auth/guards';
import { BadRequestError } from '@/server/http/errors';
import { createHandler } from '@/server/http/handler';
import { parseJson } from '@/server/http/parse';
import { apiSuccess } from '@/server/http/response';
import {
  deleteObject,
  getObjectBuffer,
  getObjectSize,
  isStorageConfigured,
  maxSizeBytesFor,
  putObject,
  UPLOAD_POLICIES,
  type UploadKind,
} from '@/server/storage';

// sharp needs the Node runtime (native binary), not edge.
export const runtime = 'nodejs';

// Longest edge we downscale to. Covers the largest responsive width the loader
// serves (1920) with headroom for PDP zoom, while capping phone-camera originals.
const MAX_EDGE = 2000;
const WEBP_QUALITY = 80;

const body = z.object({
  kind: z.enum(Object.keys(UPLOAD_POLICIES) as [UploadKind, ...UploadKind[]]),
  key: z.string().min(1).max(300),
});

/**
 * Optimize an already-uploaded image in place.
 *
 * The raw file is uploaded client → storage directly (presign), which sidesteps
 * Vercel's 4.5MB function body limit. This endpoint then pulls it back, runs it
 * through sharp (auto-orient, downscale, WebP), stores the optimized result, and
 * deletes the raw. Runs once per image at admin upload — never per view.
 */
export const POST = createHandler(async (req) => {
  if (!isStorageConfigured()) throw new BadRequestError('Object storage is not configured');
  const { kind, key } = await parseJson(req, body);

  // Admin-only kinds: product images, banners, and blog thumbnails. Review
  // images and avatars are allowed for any authenticated user.
  const adminKinds: UploadKind[] = ['productImage', 'banner', 'blogThumbnail'];
  if (adminKinds.includes(kind)) {
    await requireAdmin(req);
  } else {
    await requireUser(req);
  }

  const folder = UPLOAD_POLICIES[kind].folder;
  // Only touch keys under this kind's own folder — never an arbitrary object.
  if (!key.startsWith(`${folder}/`)) {
    throw new BadRequestError('Key does not match upload kind');
  }

  // Cap the input before downloading it — a HEAD request first, so an oversized
  // object (uploaded outside the presign flow) can't DoS this endpoint via
  // sharp. The offending object is deleted to stop storage-cost abuse.
  const sizeBytes = await getObjectSize(key);
  if (sizeBytes > maxSizeBytesFor(kind)) {
    await deleteObject(key).catch(() => undefined);
    throw new BadRequestError(`File exceeds ${UPLOAD_POLICIES[kind].maxSizeMB}MB limit`);
  }

  const raw = await getObjectBuffer(key);

  const optimized = await sharp(raw, { failOn: 'none' })
    .rotate() // honor EXIF orientation before stripping metadata
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const optimizedKey = `${folder}/${new Date().toISOString().slice(0, 7)}/${nanoid(16)}.webp`;
  const { publicUrl } = await putObject({
    key: optimizedKey,
    body: optimized,
    contentType: 'image/webp',
  });

  // Best-effort cleanup of the raw original; ignore failures (the optimized
  // image is already saved and returned).
  await deleteObject(key).catch(() => undefined);

  return apiSuccess({
    key: optimizedKey,
    publicUrl,
    bytes: optimized.byteLength,
    originalBytes: raw.byteLength,
  });
});
