# `src/server/` — Server-side architecture

The full backend lives inside this Next.js app. No separate Node service.

## Why one app?

- **One deploy unit** — Vercel/Docker ship the API, the storefront, and the admin together.
- **No CORS, no auth replay** — cookies set by Route Handlers are available to RSC, Server Actions, and the browser.
- **Server Components can call services directly** — skip the network roundtrip on the same machine.

## Layered architecture

```
HTTP layer            (Route Handlers, Server Actions)
   │
Services              (orchestration, validation, side effects)
   │
Repositories          (Prisma data access, no business logic)
   │
PostgreSQL            (via Prisma client singleton)
```

Each layer only depends on the layers below it.

## Folders

| Folder           | Purpose                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `http/`          | Response envelope (`apiSuccess`/`apiError`), domain errors, `createHandler` wrapper, Zod-aware request parsers, pagination helpers |
| `auth/`          | Password hashing, JWT (jose), session cookies, guards (`requireUser`, `requireAdmin`), guest-session ID, Google OAuth scaffold     |
| `permissions/`   | Capability-based RBAC. Never branch on `role === 'ADMIN'` in business code — call `can(session, 'orders:write:any')`               |
| `repositories/`  | One module per Prisma aggregate. Pure data access. No business rules.                                                              |
| `services/`      | Business logic. Orchestrates repositories, emits events, manages cache.                                                            |
| `validators/`    | Zod schemas for route handler inputs (body / query / params)                                                                       |
| `cache/`         | Tiered cache: process-local Map + optional Redis fallback                                                                          |
| `storage/`       | S3 client + presigned URLs + per-upload-kind policies                                                                              |
| `email/`         | Resend client + email templates                                                                                                    |
| `payments/`      | Stripe client + webhook verification                                                                                               |
| `events/`        | In-process domain event bus (`user.registered`, `order.created`, …)                                                                |
| `queues/`        | BullMQ worker setup (README scaffold — implement when async work is needed)                                                        |
| `notifications/` | Single fan-out: in-app row + queued channels                                                                                       |
| `analytics/`     | Server-side event tracking (product views, searches)                                                                               |
| `ai/`            | Skin-assessment service skeleton — swap in your LLM call                                                                           |
| `actions/`       | Server Actions (`'use server'` modules) wrapping services + revalidation                                                           |

## Route Handler contract

```ts
// app/api/v1/<resource>/route.ts
import { createHandler } from '@/server/http/handler';
import { parseJson } from '@/server/http/parse';
import { apiSuccess } from '@/server/http/response';
import { requireUser } from '@/server/auth/guards';

export const runtime = 'nodejs';

export const POST = createHandler(async (req) => {
  const session = await requireUser(req); // 401 if missing
  const body = await parseJson(req, MySchema); // 422 on Zod failure
  const data = await myService.do(session.sub, body);
  return apiSuccess(data, { status: 201, message: 'Created' });
});
```

Errors thrown from any layer become envelope responses. Zod throws → 422. Prisma `P2002` → 409. Domain `HttpError` → its status.

## Response envelope

Every successful response:

```json
{ "success": true, "message": "OK", "data": { ... }, "meta": { ... } }
```

Every error response:

```json
{
  "success": false,
  "message": "...",
  "data": null,
  "errors": [{ "path": "email", "code": "invalid_string", "message": "Enter a valid email" }]
}
```

RTK Query's `baseQuery` unwraps the `data` field automatically, so endpoint handlers see the payload directly. The envelope is preserved on `meta.envelope` for advanced consumers.

## Auth flow

1. **POST /api/v1/auth/register** or **/login** → returns `{ user, accessToken, refreshToken }`. Server also sets three httpOnly cookies: `elv_at` (access), `elv_rt` (refresh), `elv_role` (cheap RBAC hint for middleware).
2. Client stores `accessToken` in `localStorage` and sends as `Authorization: Bearer` (existing pattern). Same-origin requests don't _need_ the header — cookies authenticate them — but Bearer is supported for mobile/edge consumers.
3. **GET /api/v1/auth/me** validates the access token (cookie OR header) and returns the user.
4. On 401, RTK Query calls **POST /api/v1/auth/refresh** (single-flight via mutex) which reads the refresh cookie and mints a new access cookie.
5. **POST /api/v1/auth/logout** clears all auth cookies.

Edge middleware (`src/middleware.ts`) reads the access cookie, verifies the JWT with `jose`, and gates `/account`, `/checkout`, and `/admin` accordingly.

## Server Actions

Use Server Actions instead of `fetch('/api/...')` when the call originates in a Server Component or `<form action={…}>`. They return a typed `{ success, data }` envelope via `withAction()` (`src/server/actions/_with-action.ts`).

Implemented:

- `addToCart`, `updateCartLine`, `applyCoupon`
- `subscribeNewsletter`
- `submitReview`
- `updateProfile`

## Caching strategy

- **Route segment** revalidation (`export const revalidate = 60`) on read-mostly routes (`/products`, `/categories`).
- **Process-local Map** for hot, small payloads (category tree, product detail).
- **Redis** as the second tier — opt-in via `REDIS_URL`. Falls back gracefully when unset.
- **Tag invalidation** via `revalidateTag('cart')` from Server Actions after mutations.

## Events

Domain events (`user.registered`, `order.created`, `review.created`, …) are emitted from services _after_ the DB write. Subscribers wire up in a top-level `instrumentation.ts` (or a server entry file) and fire off side effects without blocking the request — emails, notifications, analytics rollups.

For durable / cross-instance event handling, pair with a BullMQ queue from `src/server/queues/`.
