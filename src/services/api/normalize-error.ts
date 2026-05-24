import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

import type { NormalizedError } from './types';

/**
 * Normalize any RTK Query error shape (network, parsing, server) into a single
 * predictable structure consumers can render and branch on.
 */
export function normalizeError(error: unknown): NormalizedError {
  if (!error) {
    return { status: 0, code: 'UNKNOWN', message: 'An unknown error occurred.' };
  }

  if (typeof error === 'object' && error !== null && 'status' in error) {
    const e = error as FetchBaseQueryError;

    if (typeof e.status === 'number') {
      const data = e.data as
        | { error?: { code?: string; message?: string; details?: Record<string, unknown> } }
        | undefined;
      return {
        status: e.status,
        code: data?.error?.code ?? `HTTP_${e.status}`,
        message: data?.error?.message ?? defaultMessageForStatus(e.status),
        details: data?.error?.details,
      };
    }

    if (e.status === 'FETCH_ERROR') {
      return {
        status: 0,
        code: 'NETWORK',
        message: 'Network request failed. Please check your connection.',
      };
    }
    if (e.status === 'TIMEOUT_ERROR') {
      return {
        status: 0,
        code: 'TIMEOUT',
        message: 'The request took too long. Please try again.',
      };
    }
    if (e.status === 'PARSING_ERROR') {
      return { status: 0, code: 'PARSE_ERROR', message: 'Could not parse server response.' };
    }
  }

  return { status: 0, code: 'UNKNOWN', message: 'An unknown error occurred.' };
}

function defaultMessageForStatus(status: number): string {
  if (status === 400) return 'The request was invalid.';
  if (status === 401) return 'You need to sign in to continue.';
  if (status === 403) return 'You do not have permission to do this.';
  if (status === 404) return 'We could not find what you were looking for.';
  if (status === 409) return 'This conflicts with the current state. Please refresh.';
  if (status === 429) return 'Too many requests. Please slow down.';
  if (status >= 500) return 'Something went wrong on our end. Please try again.';
  return 'Request failed.';
}
