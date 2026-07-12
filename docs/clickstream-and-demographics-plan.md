# Plan — Full Clickstream + Meta/First-Party Demographics + Recharts Dashboards

Status: **PROPOSAL — awaiting approval.** No code written yet.
Scope chosen: **(1) full clickstream** (every meaningful link/button click, timestamped, first-party DB), **(2) Meta geography breakdown + first-party customer-geo map**, **(3) Recharts dashboards**.

---

## 0. What already exists (reused, not rebuilt)

| Capability                                   | Where                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Meta Pixel + 11 standard events + 4 custom   | `src/lib/analytics/meta-pixel.ts`, `src/components/analytics/meta-pixel.tsx`                |
| CAPI (server) + advanced matching + dedup    | `src/server/analytics/meta-capi.ts`, `src/app/api/v1/track/route.ts`, `checkout.actions.ts` |
| Meta Ads insights + **age/gender** breakdown | `src/server/analytics/meta-ads.ts`, `src/app/admin/ads/breakdowns/*`                        |
| First-party logs: views / cart / search      | `src/server/analytics/track.ts`, models `ProductViewLog`/`CartEventLog`/`SearchLog`         |
| Recharts + shared theming kit                | `src/app/admin/ads/charts/*`, `chart-kit.tsx`                                               |
| Admin auth + nav pattern                     | `src/app/admin/layout.tsx` (`requireAdmin`), `src/config/navigation.ts`                     |

**Gaps this plan fills:** (a) no country/region demographic breakdown; (b) no persisted "user clicked X at time T" — the product-card click fires GA4 `select_item` only; (c) no dashboard for first-party click data.

---

## PHASE 1 — Demographics (low risk, no migration)

### 1A. Meta geography breakdown (extends existing pipeline)

- **`src/server/analytics/meta-ads.ts`**
  - Extend the `AdsBreakdowns` type: add `country: BreakdownRow[]` and `region: BreakdownRow[]`.
  - In `getAdsBreakdownsData()`, add two `fetchBreakdown(...)` calls with `breakdowns=country` and `breakdowns=region` (Graph API v21.0, same shape as the existing `age,gender` call). Run them in the existing `Promise.all`.
  - `region` returns province-level rows for PK; `country` is ISO country name.
- **`src/app/admin/ads/breakdown-tabs.tsx`**
  - Add `{ key: 'country', label: 'Country' }` and `{ key: 'region', label: 'Region' }` to `TABS`. Chart + table render automatically (they're keyed off `AdsBreakdowns`).
- **No new env, no migration.** Requires the existing `ads_read` token to have geographic breakdown permission (it does by default).

### 1B. First-party customer-geo map (your own order data)

- **New `src/server/analytics/customer-geo.ts`** → `getCustomerGeo(preset)`:
  - Aggregate `Order` rows in the date range by `shippingCity` (and `shippingArea`, `shippingCountry`) — `COUNT(*)` orders + `SUM(total_amount)` revenue, top ~15. Uses the **denormalized shipping snapshot** on `Order` (immutable, no join).
  - Filter to paid/fulfilled statuses so it reflects real customers.
- **Surface on `/admin/analytics`** (fits the first-party analytics page) as a new Recharts horizontal `BarChart` card: "Orders by city" + revenue, reusing `chart-kit.tsx`.
- Clear labeling: **Meta geo = ad-reach demographics (aggregate, ad traffic only); customer-geo = your actual buyers.** They answer different questions.

> **Accuracy note baked into the UI copy:** Meta never exposes an individual visitor's age/gender/location — all Meta demographic data is aggregate and limited to ad-attributed traffic.

---

## PHASE 2 — Full clickstream capture

### 2A. Schema — new model (narrow, relation-less, high-volume-aware)

```prisma
/// Append-only first-party clickstream. High volume: relation-less (join at
/// query time), narrow columns, time-indexed for range purge. Retention job
/// trims rows older than CLICKSTREAM_RETENTION_DAYS. Consider monthly
/// PARTITION BY RANGE (created_at) if volume warrants.
model ClickEventLog {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId     String?  @map("user_id") @db.Uuid        // logged-in attribution (no FK: tolerate orphans)
  guestId    String?  @map("guest_id") @db.VarChar(64) // guest-session attribution
  targetType String   @map("target_type") @db.VarChar(24) // product|nav|cta|banner|link|button|other
  targetId   String?  @map("target_id")   @db.VarChar(128) // productId or data-track-id
  label      String?  @db.VarChar(160)                 // trimmed text/aria-label (PII-stripped)
  href       String?  @db.VarChar(512)                 // destination (query string stripped)
  pagePath   String   @map("page_path") @db.VarChar(512) // where the click happened
  position   Int?                                       // index within a list
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz

  @@index([createdAt])
  @@index([targetType, createdAt])
  @@index([targetId, createdAt])
  @@index([userId, createdAt])
  @@map("click_event_logs")
}
```

Migration: `npm run db:migrate -- --name add_click_event_log`.

### 2B. Client capture — one delegated listener, batched

- **New `src/components/analytics/click-tracker.tsx`** (`'use client'`), mounted once in `src/app/layout.tsx` beside `<MetaPixel/>`:
  - Single capture-phase `document.addEventListener('click', …)`.
  - Resolve meaningful target: `event.target.closest('a, button, [role="button"], [data-track], [data-product-id]')`. Ignore clicks that resolve to nothing (whitespace/body) — this is the "meaningful" filter that keeps "everything" from becoming pure noise.
  - Derive fields, **`data-*` first, inference second**:
    - `targetType` ← `data-track` | infer (`product` if inside `[data-product-id]`, else `nav`/`cta`/`link`/`button`).
    - `targetId` ← `data-track-id` | `data-product-id`.
    - `label` ← `data-track-label` | trimmed `innerText`/`aria-label`, truncated 160, **stripped of anything email/phone-like**.
    - `href` ← anchor href with **query string removed**.
    - `position` ← `data-index`.
    - `pagePath` ← `location.pathname`.
  - **Batching:** in-memory queue; flush when size ≥ 10, on a 5s timer, and on `visibilitychange==='hidden'` / `pagehide` via `navigator.sendBeacon('/api/v1/click', Blob)` so in-flight clicks survive navigation.
  - **Gating:** production-only (mirrors the pixel/GA — gated purely on the environment, no public "enable in dev" flag). Optional `NEXT_PUBLIC_CLICKSTREAM_SAMPLE` (0–1) sampling knob for guests if volume spikes.

### 2C. `data-track` enrichment on high-value components (clean labels)

The global listener already catches everything; these just make the important targets self-describe instead of relying on inferred text:

- `src/design-system/patterns/product-card.tsx` → `data-track="product" data-product-id data-index`.
- Navbar (`src/components/layout/*`) → `data-track="nav"`.
- `src/app/(shop)/_components/hero-showcase.tsx` + banners → `data-track="cta"/"banner" data-track-id`.
  (Additive attributes only — zero behavior change.)

### 2D. Ingest endpoint

- **New `src/app/api/v1/click/route.ts`** (`runtime='nodejs'`, `createHandler`, `apiNoContent`):
  - Same-origin guard (copy from `/api/v1/track`).
  - Parse `sendBeacon` body (Blob → JSON). Zod: `{ events: Array<ClickInput> }`, cap `events` at 30, cap all string lengths.
  - Resolve `getSession(req)` + `getGuestId()` once; stamp `userId`/`guestId` on every row (client never sends identity — server derives it, same as the CAPI relay).
  - Bot filter by UA; drop obvious crawlers.
  - `prisma.clickEventLog.createMany(...)`. Always `204`, never throws (best-effort like existing trackers).

### 2E. Retention (guard the volume the user opted into)

- **New purge** — add a job under `src/server/queues/` (reuse existing queue) or a documented SQL cron: `DELETE FROM click_event_logs WHERE created_at < now() - interval '90 days'`. Window via `CLICKSTREAM_RETENTION_DAYS` (default 90). Note monthly partitioning as the scale-up path (schema already hints this for `ProductViewLog`).

---

## PHASE 3 — Clicks dashboard (Recharts)

- **New `src/server/analytics/click-events.ts`** → `getClickDashboard(preset)`: `$queryRaw` UTC-bucketed aggregates (mirrors `pixel-events.ts`): daily totals, top targets, by-type counts, top clicked products (join `Product` for names), unique users, previous-period deltas.
- **New `src/app/admin/clicks/page.tsx`** (server component; `dynamic='force-dynamic'`; `buildMetadata({ noIndex:true })`; auth via parent `admin/layout.tsx`):
  - KPI cards (total clicks, unique visitors, top page) with `DeltaBadge`.
  - **Clicks over time** — `AreaChart` (reuse `event-sparkline`/`ga-trend-chart` style).
  - **Top clicked targets** — horizontal `BarChart` (reuse `BreakdownBarChart`).
  - **Clicks by target type** — `BarChart`.
  - **Top clicked products** — bar/table joined to product names + thumbnails.
  - Date-preset selector via `src/lib/ads/date-presets.ts`.
- **Nav:** add `{ label: 'Clicks', href: '/admin/clicks' }` to `adminNav` in `src/config/navigation.ts`.

---

## Files touched (summary)

**New (9):** `prisma` migration; `src/components/analytics/click-tracker.tsx`; `src/app/api/v1/click/route.ts`; `src/server/analytics/click-events.ts`; `src/server/analytics/customer-geo.ts`; `src/app/admin/clicks/page.tsx` + `_components/` charts; retention job.
**Edited (6):** `prisma/schema.prisma`; `src/server/analytics/meta-ads.ts`; `src/app/admin/ads/breakdown-tabs.tsx`; `src/app/layout.tsx`; `src/config/navigation.ts`; `src/app/admin/analytics/page.tsx` (customer-geo card); + `data-track` attrs on ~4 components.

## Assumed defaults (say the word to change)

- Clickstream **production-only** (dev flag for testing) · **90-day** retention · **100%** sampling (knob available) · labels **PII-stripped**, hrefs **query-stripped**.
- Consent: PK-focused store → gated on the prod flag; **if you have/plan a cookie-consent gate, clickstream should respect it** (flag me if so).

## Verification

`prisma migrate` + `db:generate` → `npm run type-check` → `vitest` → local click-through with dev flag, confirm rows in `db:studio` → dashboards render.

## Suggested sequencing

Phase 1 first (small, no migration, immediate demographic value) → Phase 2 (capture) → Phase 3 (dashboard). Each phase is independently shippable.
