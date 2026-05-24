import { nanoid } from 'nanoid';
import { z } from 'zod';

import { requireUser } from '@/server/auth/guards';
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
  sizeBytes: z.number().int().positive().optional(),
});

export const POST = createHandler(async (req) => {
  if (!isStorageConfigured()) {
    throw new BadRequestError('Object storage is not configured');
  }

  await requireUser(req); // Avatars/reviews require a user; admins gate elsewhere.
  const { kind, contentType, filename, sizeBytes } = await parseJson(req, presignBody);

  assertUploadAllowed(kind, contentType, sizeBytes);

  const ext = filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : 'bin';
  const key = `${UPLOAD_POLICIES[kind].folder}/${new Date().toISOString().slice(0, 7)}/${nanoid(16)}.${ext}`;

  const presigned = await presignUpload({ key, contentType, expiresIn: 60 });
  return apiSuccess({ key, ...presigned });
});
