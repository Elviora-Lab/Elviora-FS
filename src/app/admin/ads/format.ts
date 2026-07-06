/** Client-safe number formatting shared by the ads dashboard components. */

export function money(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    }).format(value);
  } catch {
    // Unknown/invalid currency code — fall back to a plain number + code.
    return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`;
  }
}

/** Compact currency for tight spots like chart axis ticks — e.g. `$1.2K`, `$3M`. */
export function moneyCompact(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return `${value.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })} ${currency}`;
  }
}

export const roasText = (roas: number): string => `${roas.toFixed(2)}×`;

export const intText = (n: number): string => Math.round(n).toLocaleString('en-US');

/** Percentage change between two values, or null when there's no valid base. */
export function deltaPct(current: number, previous: number | null | undefined): number | null {
  if (previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
