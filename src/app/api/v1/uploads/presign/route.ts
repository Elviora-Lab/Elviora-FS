import { nanoid } from 'nanoid';
import { z } from 'zod';

import { requireAdmin, requireUser } from '@/server/auth/guards';
import { BadRequestError } from '@/server/http/errors';
import { createHandler } from '@/server/http/handler';
import { parseJson } from '@/server/http/parse';
import { apiSuccess } from '@/server/http/response';
import {
  assertUploadAllowed,
  isStorageConfigured,
  presignUpload,
  UPLOAD_POLICIES,
  type UploadKind,
} from '@/server/storage';

export const runtime = 'nodejs';

const presignBody = z.object({
  kind: z.enum(Object.keys(UPLOAD_POLICIES) as [UploadKind, ...UploadKind[]]),
  contentType: z.string().min(1).max(120),
  filename: z.string().min(1).max(200),
  sizeBytes: z.number().int().positive(),
});

export const POST = createHandler(async (req) => {
  if (!isStorageConfigured()) {
    throw new BadRequestError('Object storage is not configured');
  }

  const { kind, contentType, filename, sizeBytes } = await parseJson(req, presignBody);

  // Admin-only kinds: product images, banners, and blog thumbnails. Review
  // images and avatars are allowed for any authenticated user.
  const adminKinds: UploadKind[] = ['productImage', 'banner', 'blogThumbnail'];
  if (adminKinds.includes(kind)) {
    await requireAdmin(req);
  } else {
    await requireUser(req);
  }

  assertUploadAllowed(kind, contentType, sizeBytes);

  const ext = filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : 'bin';
  const key = `${UPLOAD_POLICIES[kind].folder}/${new Date().toISOString().slice(0, 7)}/${nanoid(16)}.${ext}`;

  // Sign the declared size into the presigned PUT — storage rejects an upload
  // whose Content-Length doesn't match, so the size check can't be bypassed.
  const presigned = await presignUpload({
    key,
    contentType,
    contentLength: sizeBytes,
    expiresIn: 60,
  });
  return apiSuccess({ key, ...presigned });
});
