/**
 * Token storage abstraction.
 *
 * Tokens live in `localStorage` for resilience to page reloads in this client
 * scaffold. In production, prefer httpOnly cookies issued by your auth gateway
 * (and treat this module as a thin wrapper around a server fetch).
 */

const ACCESS_KEY = 'elviora.auth.access';
const REFRESH_KEY = 'elviora.auth.refresh';

const isBrowser = () => typeof window !== 'undefined';

export const tokenStorage = {
  getAccess(): string | null {
    if (!isBrowser()) return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  getRefresh(): string | null {
    if (!isBrowser()) return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  set({ access, refresh }: { access: string; refresh?: string }) {
    if (!isBrowser()) return;
    window.localStorage.setItem(ACCESS_KEY, access);
    if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    if (!isBrowser()) return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};
