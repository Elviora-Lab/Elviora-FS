# Secrets Rotation Checklist

The following production credentials were previously stored in local env files
(`.env`, `.env.local`, `.env.vercel`) and have been redacted. Because they were
visible in the working tree, they should be treated as potentially exposed and
rotated.

## Rotate these immediately

| Service          | Secret                                      | Where to rotate                                                                       |
| ---------------- | ------------------------------------------- | ------------------------------------------------------------------------------------- |
| Supabase / S3    | `S3_ACCESS_KEY_ID` + `S3_SECRET_ACCESS_KEY` | Supabase Dashboard → Project Settings → API → S3 Keys                                 |
| PostEx           | `POSTEX_API_TOKEN`                          | PostEx dashboard                                                                      |
| Meta CAPI        | `META_CAPI_ACCESS_TOKEN`                    | Events Manager → Settings → Conversions API                                           |
| Meta Ads         | `META_ADS_ACCESS_TOKEN`                     | Business Settings → System Users → Generate new token                                 |
| Google Analytics | `GA_SA_PRIVATE_KEY` + `GA_SA_CLIENT_EMAIL`  | Google Cloud IAM → Service Accounts → Manage Keys                                     |
| Vercel           | `VERCEL_OIDC_TOKEN`                         | Vercel dashboard → Project Settings → Environment Variables (or regenerate CLI token) |
| Auth (JWT)       | `JWT_SECRET` + `JWT_REFRESH_SECRET`         | Generate new strings and update in Vercel env vars                                    |

## Post-rotation

1. Add the new values to Vercel (Production / Preview / Development scopes).
2. Redeploy.
3. Delete this file and `.env.vercel` once rotation is complete.

## Never store these in the repo

- Private keys (RSA, JWT, service-account keys)
- API tokens (S3, PostEx, Meta, Google, Resend, Stripe, Sentry)
- Database passwords
- OAuth client secrets
- Vercel / OIDC tokens

Use Vercel Environment Variables or a secret manager (Doppler, AWS Secrets Manager, etc.).
