# Google Analytics 4 (GA4)

Free, client-side GA4 tracking via `gtag.js`, wired to the same call sites as the
Meta Pixel. It measures page views, the e-commerce funnel (view → cart →
checkout → purchase), search, and revenue.

## Setup

1. In **Google Analytics → Admin → Data streams → Web**, create (or open) a web
   stream for the storefront and copy its **Measurement ID** — it looks like
   `G-XXXXXXXXXX` (not a `UA-…` id, not an API secret).
2. Set the env var and redeploy:
   ```
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```
3. That's it. GA only loads in **production** (`NEXT_PUBLIC_ENVIRONMENT=production`)
   and only when `NEXT_PUBLIC_GA_ID` is set; otherwise it stays completely inert.

## How it's wired

- **Loader:** `src/components/analytics/google-analytics.tsx` (`<GoogleAnalytics />`,
  mounted in `src/app/layout.tsx` next to `<MetaPixel />`) injects `gtag.js` and
  fires `page_view` on every client-side route change.
- **Events:** `src/lib/analytics/google.ts` (`ga.*`) maps app actions to GA4
  recommended events using the `items[]` + `value`/`currency` schema.
- **One call, both destinations:** call sites use the unified facade
  `src/lib/analytics/index.ts` (`analytics.*`), which fans out to **both** GA4 and
  the Meta Pixel. Add a new tracked action there once.

| App action                                      | GA4 event                                     |
| ----------------------------------------------- | --------------------------------------------- |
| Product view                                    | `view_item`                                   |
| Category view                                   | `view_item_list`                              |
| Add to cart                                     | `add_to_cart`                                 |
| Add to wishlist                                 | `add_to_wishlist`                             |
| Checkout start                                  | `begin_checkout`                              |
| Choose payment                                  | `add_payment_info`                            |
| Order placed                                    | `purchase` (with `transaction_id` = order id) |
| Search                                          | `search`                                      |
| Coupon applied                                  | `select_promotion`                            |
| Newsletter / back-in-stock / skincare / contact | custom events                                 |

## Verifying

1. Deploy (or run locally with `NEXT_PUBLIC_ENVIRONMENT=production` +
   `NEXT_PUBLIC_GA_ID` set).
2. Browse the site and watch **GA4 → Reports → Realtime**, or enable **DebugView**
   (Chrome "Google Analytics Debugger" extension, or append `?debug_mode=1`) to see
   `page_view`, `view_item`, `add_to_cart`, `begin_checkout`, and a test `purchase`
   with the right `value`/`currency`/`items`.
3. In the Network tab you'll see requests to `google-analytics.com/g/collect`.

In development neither GA nor the Pixel loads; the facade logs each event to the
console (`[analytics] …`) so you can still confirm they fire.

## Not included (possible future work)

- Server-side **Measurement Protocol** for purchases (mirror of the Meta
  Conversions API) for ad-blocker-resistant revenue.
- **Consent Mode v2** + a cookie-consent banner.
- Pulling the **GA4 Data API** into an `/admin` dashboard.
