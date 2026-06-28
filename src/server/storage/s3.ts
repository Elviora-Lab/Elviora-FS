import 'server-only';

import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
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
  if (serverEnv.S3_PUBLIC_URL) {
    return `${serverEnv.S3_PUBLIC_URL.replace(/\/+$/, '')}/${key}`;
  }
  return `https://${serverEnv.S3_BUCKET}.s3.${serverEnv.S3_REGION}.amazonaws.com/${key}`;
}

export async function presignUpload({
  key,
  contentType,
  expiresIn = 60,
}: {
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<{ uploadUrl: string; publicUrl: string }> {
  if (!serverEnv.S3_BUCKET) throw new Error('S3_BUCKET is not configured');
  const command = new PutObjectCommand({
    Bucket: serverEnv.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(client(), command, { expiresIn });
  return { uploadUrl, publicUrl: publicUrlFor(key) };
}

export function isStorageConfigured(): boolean {
  return Boolean(
    serverEnv.S3_REGION &&
    serverEnv.S3_BUCKET &&
    serverEnv.S3_ACCESS_KEY_ID &&
    serverEnv.S3_SECRET_ACCESS_KEY,
  );
}
