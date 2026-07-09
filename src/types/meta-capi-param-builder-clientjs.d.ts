/**
 * Ambient types for Meta's client-side CAPI Parameter Builder, which ships as a
 * browser UMD bundle with no `.d.ts`. Only the surface we use is declared.
 * @see https://github.com/facebook/capi-param-builder
 */
declare module 'meta-capi-param-builder-clientjs' {
  /**
   * Captures/normalizes `_fbp` & `_fbc` cookies (generating `_fbc` from a
   * `?fbclid` param when absent). Pass the current URL; `getIpFn` is optional.
   */
  export function processAndCollectAllParams(
    url?: string,
    getIpFn?: () => Promise<string>,
  ): Promise<Record<string, unknown>>;
  export function getFbc(): string | null;
  export function getFbp(): string | null;
  export function getClientIpAddress(): string | null;
}
