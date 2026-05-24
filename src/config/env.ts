import { z } from 'zod';

// Treat empty strings ("FOO=" in .env) as "not set". Zod `.url()` etc.
// reject empty strings outright, which surprises users on Vercel where
// unset secrets often serialize as "".
const emptyToUndef = (v: unknown) => (v === '' ? undefined : v);
const optionalUrl = z.preprocess(emptyToUndef, z.string().url().optional());
const optionalStr = z.preprocess(emptyToUndef, z.string().optional());
const apiUrl = z.preprocess(emptyToUndef, z.string().default('/api/v1'));

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SITE_NAME: z.string().default('Elviora'),
  NEXT_PUBLIC_API_URL: apiUrl,
  NEXT_PUBLIC_CDN_URL: optionalUrl,
  NEXT_PUBLIC_ENVIRONMENT: z.enum(['development', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_GTM_ID: optionalStr,
  NEXT_PUBLIC_GA_ID: optionalStr,
  NEXT_PUBLIC_SENTRY_DSN: optionalStr,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: optionalStr,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalStr,
});

const serverEnvSchema = z.object({
  API_URL: optionalUrl,
  JWT_SECRET: optionalStr,
  JWT_REFRESH_SECRET: optionalStr,
  NEXTAUTH_SECRET: optionalStr,
  GOOGLE_CLIENT_SECRET: optionalStr,
  SENTRY_AUTH_TOKEN: optionalStr,
  RESEND_API_KEY: optionalStr,
  STRIPE_SECRET_KEY: optionalStr,
  STRIPE_WEBHOOK_SECRET: optionalStr,
  REDIS_URL: optionalStr,
  S3_REGION: optionalStr,
  S3_BUCKET: optionalStr,
  S3_ACCESS_KEY_ID: optionalStr,
  S3_SECRET_ACCESS_KEY: optionalStr,
  S3_PUBLIC_URL: optionalUrl,
  OPENAI_API_KEY: optionalStr,
  // postgresql:// URLs are not valid http(s) URLs, so use a plain string check
  // and require the protocol prefix when set.
  DATABASE_URL: z.preprocess(
    emptyToUndef,
    z
      .string()
      .regex(/^postgres(ql)?:\/\//, 'DATABASE_URL must start with postgres:// or postgresql://')
      .optional(),
  ),
  DIRECT_URL: z.preprocess(
    emptyToUndef,
    z
      .string()
      .regex(/^postgres(ql)?:\/\//, 'DIRECT_URL must start with postgres:// or postgresql://')
      .optional(),
  ),
});

// Public env — must reference each NEXT_PUBLIC_* var statically for Next's
// build-time replacement to work.
const publicEnvSource = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_CDN_URL: process.env.NEXT_PUBLIC_CDN_URL,
  NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
  NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
};

const publicParsed = publicEnvSchema.safeParse(publicEnvSource);
if (!publicParsed.success) {
  console.error('Invalid public environment variables:', publicParsed.error.flatten().fieldErrors);
  throw new Error('Invalid public environment variables');
}

export const publicEnv = publicParsed.data;

// Server env — only accessible on the server.
export const serverEnv = (() => {
  if (typeof window !== 'undefined') {
    return {} as z.infer<typeof serverEnvSchema>;
  }
  const parsed = serverEnvSchema.safeParse({
    API_URL: process.env.API_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    REDIS_URL: process.env.REDIS_URL,
    S3_REGION: process.env.S3_REGION,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_PUBLIC_URL: process.env.S3_PUBLIC_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  });
  if (!parsed.success) {
    console.error('Invalid server environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid server environment variables');
  }
  return parsed.data;
})();

export const isProd = publicEnv.NEXT_PUBLIC_ENVIRONMENT === 'production';
export const isDev = publicEnv.NEXT_PUBLIC_ENVIRONMENT === 'development';
