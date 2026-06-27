import { isRejectedWithValue, type Middleware } from '@reduxjs/toolkit';
import * as Sentry from '@sentry/nextjs';

import { isDev } from '@/config/env';

/**
 * Logs RTK Query rejections. In development they go to the console; in
 * production they're attached to Sentry as breadcrumbs (no-op when DSN unset)
 * so they show up as context on any subsequently captured error.
 */
export const rtkErrorLogger: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.warn('[rtk-query]', action.type, action.payload);
    } else {
      Sentry.addBreadcrumb({
        category: 'rtk-query',
        level: 'error',
        message: action.type,
        data: { payload: action.payload },
      });
    }
  }
  return next(action);
};
