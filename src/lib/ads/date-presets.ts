/**
 * Ad-dashboard date-range presets.
 *
 * Client-safe: kept out of `@/server/analytics/meta-ads` (which is `server-only`)
 * so the client sub-nav and page components can share the same preset list and
 * labels without pulling server code into the browser bundle. `meta-ads.ts`
 * re-exports these for the server-side fetchers.
 */

export const AD_DATE_PRESETS = [
  'today',
  'yesterday',
  'last_7d',
  'last_14d',
  'last_30d',
  'last_90d',
  'this_month',
  'last_month',
  'maximum',
] as const;

export type AdDatePreset = (typeof AD_DATE_PRESETS)[number];

export const AD_DATE_PRESET_LABELS: Record<AdDatePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last_7d: 'Last 7 days',
  last_14d: 'Last 14 days',
  last_30d: 'Last 30 days',
  last_90d: 'Last 90 days',
  this_month: 'This month',
  last_month: 'Last month',
  maximum: 'All time',
};

export function isAdDatePreset(value: string | undefined): value is AdDatePreset {
  return Boolean(value) && (AD_DATE_PRESETS as readonly string[]).includes(value as string);
}

/** Default window when none (or an invalid one) is supplied via the URL. */
export const DEFAULT_AD_RANGE: AdDatePreset = 'last_30d';

/** Presets offered as tabs in the dashboard nav (omits the noisier `yesterday`/`last_14d`). */
export const AD_RANGE_TABS: AdDatePreset[] = [
  'today',
  'last_7d',
  'last_30d',
  'last_90d',
  'this_month',
  'last_month',
  'maximum',
];
