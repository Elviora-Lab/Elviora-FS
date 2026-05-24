import axios, { type AxiosError, type AxiosInstance } from 'axios';

import { publicEnv } from '@/config/env';

import { tokenStorage } from '@/services/auth/token-storage';

/**
 * Axios instance for non-RTK-Query call sites (server actions, one-off
 * fetches, integrations). For data in components, prefer RTK Query hooks.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: publicEnv.NEXT_PUBLIC_API_URL,
  timeout: 20_000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-client': 'elviora-web',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Soft-clear; caller decides whether to redirect.
      tokenStorage.clear();
    }
    return Promise.reject(error);
  },
);
