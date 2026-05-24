import { isRejectedWithValue, type Middleware } from '@reduxjs/toolkit';

import { isDev } from '@/config/env';

/**
 * Logs RTK Query rejections during development. In production, forward to
 * your observability sink (Sentry, Datadog) here instead of `console`.
 */
export const rtkErrorLogger: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action) && isDev) {
    // eslint-disable-next-line no-console
    console.warn('[rtk-query]', action.type, action.payload);
  }
  return next(action);
};
