declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    /** Google Analytics 4 (gtag.js) — injected by `<GoogleAnalytics />`. */
    gtag?: (...args: unknown[]) => void;
  }
}

export {};
