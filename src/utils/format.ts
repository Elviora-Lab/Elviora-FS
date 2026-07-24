/**
 * Pakistani rupees are typically displayed without paisa (cents) in retail.
 * Other currencies retain 2 decimal places by default.
 */
export function formatMoney(amount: number, currency = 'PKR', locale = 'en-PK'): string {
  const isPkr = currency === 'PKR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: isPkr ? 0 : 2,
    maximumFractionDigits: isPkr ? 0 : 2,
  }).format(amount);
}

export function formatDate(
  value: string | number | Date,
  opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
  locale = 'en-PK',
): string {
  return new Intl.DateTimeFormat(locale, opts).format(new Date(value));
}

export function formatNumber(value: number, locale = 'en-PK'): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/**
 * Clean a variant/shade label for display. Source shade labels bake the swatch
 * colour into the string as "1-W @#FCD6C7"; this strips the "@#hex" so orders
 * and fulfilment views read the shade name ("1-W") — matching how the product
 * page renders it. Idempotent (a label with no hex is returned unchanged).
 */
export function shadeLabel(label: string | null | undefined): string | null {
  if (!label) return null;
  return (
    label
      .replace(/\s*@#?[0-9a-fA-F]{3,8}\b/i, '')
      .replace(/[·\s]+$/, '')
      .trim() || null
  );
}

export function truncate(str: string, max = 80): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1).trimEnd() + '…';
}
