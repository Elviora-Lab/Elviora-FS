import 'server-only';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { serverEnv } from '@/config/env';

let cachedClient: S3Client | null = null;

function client(): S3Client {
  if (cachedClient) return cachedClient;
  if (!serverEnv.S3_REGION || !serverEnv.S3_ACCESS_KEY_ID || !serverEnv.S3_SECRET_ACCESS_KEY) {
    throw new Error('S3 is not configured');
  }
  cachedClient = new S3Client({
    region: serverEnv.S3_REGION,
    credentials: {
      accessKeyId: serverEnv.S3_ACCESS_KEY_ID,
      secretAccessKey: serverEnv.S3_SECRET_ACCESS_KEY,
    },
    // S3-compatible providers (e.g. Supabase Storage) need a custom endpoint
    // and path-style addressing (bucket in the path, not the host).
    ...(serverEnv.S3_ENDPOINT ? { endpoint: serverEnv.S3_ENDPOINT, forcePathStyle: true } : {}),
  });
  return cachedClient;
}

export function publicUrlFor(key: string): string {
  // Trim first: a stray trailing newline/space in the env var would otherwise
  // land inside the URL (e.g. ".../bucket\n/key") and break every image.
  const cleanKey = key.trim().replace(/^\/+/, '');
  if (serverEnv.S3_PUBLIC_URL) {
    return `${serverEnv.S3_PUBLIC_URL.trim().replace(/\/+$/, '')}/${cleanKey}`;
  }
  return `https://${serverEnv.S3_BUCKET}.s3.${serverEnv.S3_REGION}.amazonaws.com/${cleanKey}`;
}

export async function presignUpload({
  key,
  contentType,
  contentLength,
  expiresIn = 60,
}: {
  key: string;
  contentType: string;
  /** When provided, the Content-Length is part of the signature — an upload of
   *  a different size than declared is rejected by the storage provider. */
  contentLength?: number;
  expiresIn?: number;
}): Promise<{ uploadUrl: string; publicUrl: string }> {
  if (!serverEnv.S3_BUCKET) throw new Error('S3_BUCKET is not configured');
  const command = new PutObjectCommand({
    Bucket: serverEnv.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ...(contentLength !== undefined ? { ContentLength: contentLength } : {}),
  });
  const uploadUrl = await getSignedUrl(client(), command, { expiresIn });
  return { uploadUrl, publicUrl: publicUrlFor(key) };
}

const normalizeKey = (key: string) => key.trim().replace(/^\/+/, '');

/** Size of an object in bytes without downloading it (HEAD request). */
export async function getObjectSize(key: string): Promise<number> {
  if (!serverEnv.S3_BUCKET) throw new Error('S3_BUCKET is not configured');
  const res = await client().send(
    new HeadObjectCommand({ Bucket: serverEnv.S3_BUCKET, Key: normalizeKey(key) }),
  );
  return res.ContentLength ?? 0;
}

/** Download an object's bytes — used to optimize an already-uploaded image. */
export async function getObjectBuffer(key: string): Promise<Buffer> {
  if (!serverEnv.S3_BUCKET) throw new Error('S3_BUCKET is not configured');
  const res = await client().send(
    new GetObjectCommand({ Bucket: serverEnv.S3_BUCKET, Key: normalizeKey(key) }),
  );
  if (!res.Body) throw new Error('Object has no body');
  const bytes = await res.Body.transformToByteArray();
  return Buffer.from(bytes);
}

/** Upload a buffer directly from the server (immutable long-cache). */
export async function putObject({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<{ publicUrl: string }> {
  if (!serverEnv.S3_BUCKET) throw new Error('S3_BUCKET is not configured');
  await client().send(
    new PutObjectCommand({
      Bucket: serverEnv.S3_BUCKET,
      Key: normalizeKey(key),
      Body: body,
      ContentType: contentType,
      // Keys are content-unique (nanoid), so the bytes never change — cache hard.
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return { publicUrl: publicUrlFor(key) };
}

/** Best-effort object deletion (e.g. removing a raw upload after optimizing). */
export async function deleteObject(key: string): Promise<void> {
  if (!serverEnv.S3_BUCKET) throw new Error('S3_BUCKET is not configured');
  await client().send(
    new DeleteObjectCommand({ Bucket: serverEnv.S3_BUCKET, Key: normalizeKey(key) }),
  );
}

export function isStorageConfigured(): boolean {
  return Boolean(
    serverEnv.S3_REGION &&
    serverEnv.S3_BUCKET &&
    serverEnv.S3_ACCESS_KEY_ID &&
    serverEnv.S3_SECRET_ACCESS_KEY,
  );
}
