import 'server-only';

import { BadRequestError } from '@/server/http/errors';

export const UPLOAD_POLICIES = {
  productImage: {
    folder: 'products',
    maxSizeMB: 8,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const,
  },
  reviewImage: {
    folder: 'reviews',
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  },
  avatar: {
    folder: 'avatars',
    maxSizeMB: 2,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  },
  banner: {
    folder: 'banners',
    maxSizeMB: 12,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const,
  },
  blogThumbnail: {
    folder: 'blog',
    maxSizeMB: 6,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const,
  },
} as const;

export type UploadKind = keyof typeof UPLOAD_POLICIES;

export function assertUploadAllowed(kind: UploadKind, contentType: string, sizeBytes: number) {
  const policy = UPLOAD_POLICIES[kind];
  const allowed = policy.allowedTypes as readonly string[];
  if (!allowed.includes(contentType)) {
    throw new BadRequestError(`Unsupported file type for ${kind}: ${contentType}`);
  }
  if (sizeBytes > policy.maxSizeMB * 1024 * 1024) {
    throw new BadRequestError(`File exceeds ${policy.maxSizeMB}MB limit`);
  }
}

export function maxSizeBytesFor(kind: UploadKind): number {
  return UPLOAD_POLICIES[kind].maxSizeMB * 1024 * 1024;
}
