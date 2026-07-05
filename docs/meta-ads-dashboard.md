# Meta Ads Dashboard — Setup Guide

A **read-only** ad-performance dashboard lives at **`/admin/ads`**. It pulls spend,
ROAS, revenue and delivery metrics for your ad account straight from Meta's
Marketing API (Insights).

- **Read-only.** It only _reads_ performance. It cannot create, pause or edit
  campaigns, and it cannot spend money. The token it uses has the `ads_read`
  scope only.
- **Inert until configured.** With the two environment variables below unset,
  the page renders a setup card and nothing else changes. The storefront is
  never affected.
- **Admin-gated.** It sits under `/admin`, protected by `requireAdmin()` and the
  edge middleware.

You need two values:

| Env var                 | What it is                                                            |
| ----------------------- | --------------------------------------------------------------------- |
| `META_ADS_ACCOUNT_ID`   | Your ad account id — digits only (with or without the `act_` prefix). |
| `META_ADS_ACCESS_TOKEN` | A **System User** token with the `ads_read` permission.               |

Everything is generated in **Meta Business Settings** → <https://business.facebook.com/settings>.

---

## ⚠️ Prerequisite: you must be a Business Portfolio admin

Generating a System User token requires being an **Admin of the Business
Portfolio itself** — _not_ just the owner of the Facebook Page or the ad
account. Those are different roles. (This is the "you must be an admin" wall you
may have hit generating the Conversions API token.)

**Verify:** Business Settings → **Users → People** → click your name → it should
say **Full control / Admin access**. If it doesn't, whoever created the Business
Portfolio must promote you first.

---

## Step 1 — Ad account id (`META_ADS_ACCOUNT_ID`)

1. Go to **Business Settings → Accounts → Ad accounts**.
2. Click your ad account. The **Ad account id** (e.g. `1234567890`) shows at the top.
   - Shortcut: open <https://adsmanager.facebook.com> and read the URL —
     `...act=1234567890...`. That number is it.
3. Save it as `META_ADS_ACCOUNT_ID` — **digits only**, no `act_` needed (the app
   adds the prefix).

---

## Step 2 — Create a System User

1. **Business Settings → Users → System Users**.
2. Click **Add**.
3. Name it clearly, e.g. `elviora-ads-reader`.
4. Role: **Employee** (read-only is enough — you do not need an Admin system user
   for reporting).
5. **Create System User**.

---

## Step 3 — Assign the **ad account** to it (read-only)

> This is the step most people get wrong. When the "Assign assets" panel opens it
> often defaults to **Facebook Pages** — that is the **wrong asset type**. Page
> permissions (Content / Messages / "Ads" / "Insights") do **not** grant access
> to your ad account's spend data. You must assign the **Ad account** asset.

1. Select your system user → **Assign assets**.
2. In the **Select asset type** column, choose **Ad accounts** (not Facebook
   Pages — scroll if needed).
3. Select your ad account in the middle column.
4. On the right, choose **Partial access → View performance** (read-only).
   **Do not** enable "Manage campaigns."
5. **Save Changes.**

**If "Ad accounts" is not in the asset-type list**, your Business Portfolio has no
ad account attached yet:

1. Left sidebar → **Accounts → Ad accounts → Add**.
2. Either **Add an ad account** (paste your existing id) or **Create a new ad
   account**.
3. Return to the system user → **Assign assets → Ad accounts**; it will now appear.

**Alternative route** (if the "Assign assets" flow keeps hiding it) — assign from
the ad account's side, which always works:

1. **Accounts → Ad accounts → select your ad account**.
2. **Assign people** (or the **People** tab) → **Add people**.
3. Select your system user → enable **View performance** → **Assign**.

---

## Step 4 — Generate the token (`META_ADS_ACCESS_TOKEN`)

1. With the system user selected, click **Generate new token**.
2. **App:** pick your Meta app (the same one behind your pixel — any app in the
   business works).
3. **Token expiration:** choose **Never** (a server integration wants a
   non-expiring token).
4. **Permissions:** check ✅ **`ads_read`** (optionally also `read_insights`).
   That is all this dashboard needs.
5. **Generate token**, then **copy it immediately** — Meta shows it only once.
   This `EAAG...` string is `META_ADS_ACCESS_TOKEN`.

> No App Review or Business Verification is required to read **your own** ad
> account. Those are only needed to access _other_ businesses' accounts.

---

## Step 5 — Test the token before deploying (optional, 30 seconds)

Paste your two values into this and run it in a terminal:

```bash
curl "https://graph.facebook.com/v21.0/act_YOUR_ACCOUNT_ID/insights?fields=spend,purchase_roas&date_preset=last_30d&access_token=YOUR_TOKEN"
```

- `{"data":[{...}]}` or `{"data":[]}` → ✅ token + account work.
- `{"error":{...}}` → the message says what's wrong (usually the `ads_read` scope
  is missing, or the ad account wasn't assigned in Step 3).

---

## Step 6 — Add the variables and deploy

**Local development** — add to `.env`:

```bash
META_ADS_ACCESS_TOKEN=EAAG...your_system_user_token
META_ADS_ACCOUNT_ID=1234567890
```

**Production (Vercel):**

1. Vercel → your Elviora-FS project → **Settings → Environment Variables**.
2. Add both (scope: **Production**, and Preview if you want).
3. **Redeploy** — environment changes only take effect on a fresh deploy.
4. Open **`/admin/ads`**; the setup card is replaced by live data.

> `META_ADS_*` are **server-only** (no `NEXT_PUBLIC_` prefix), so the token never
> reaches the browser. Keep it secret; never commit it.

---

## What the dashboard shows

Selectable date ranges: Today / Last 7d / Last 30d / Last 90d / This month / Last
month / All time.

- **Headline tiles** — Amount spent, Purchase revenue, **ROAS** (flagged red below
  break-even), Cost per purchase.
- **Delivery metrics** — Impressions, Reach, Clicks, CTR, CPC, CPM.
- **Campaigns table** — every campaign with delivery, ranked by spend, with
  spend / revenue / ROAS / purchases / CPA.

The conversions that feed ROAS are the same **Purchase** events your Pixel +
Conversions API report, so it's the same funnel end-to-end.

---

## Troubleshooting

| Symptom                                          | Cause / fix                                                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Page still shows the setup card                  | One or both env vars are unset, or you haven't redeployed since adding them.                                               |
| "Couldn't load ad data" error card               | Token lacks `ads_read`, wrong ad account id, expired token, or the account wasn't assigned to the system user (Step 3).    |
| ROAS / revenue is 0 but spend shows              | No attributed purchases in that window, or the pixel/CAPI Purchase events aren't landing on this ad account's attribution. |
| "You must be an admin" when generating the token | You're not a Business Portfolio admin — see the Prerequisite section.                                                      |

---

## Phase 2 (not built yet): write controls

Adding pause/resume and budget edits would require the **`ads_management`** scope
(instead of `ads_read`) plus a couple of server actions. It's intentionally left
out so this dashboard can never change a live campaign or budget. Ask when you
want it.
