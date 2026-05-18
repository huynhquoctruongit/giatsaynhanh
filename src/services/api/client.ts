import axios, { AxiosError, type AxiosInstance } from 'axios';
import { STORAGE_KEYS } from '@/helpers/constants/storage-keys';
import type { ApiError, ApiResponse } from '@/types/api';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;
  const token = window.localStorage.getItem(STORAGE_KEYS.token);
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: ApiError }>) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEYS.token);
      window.localStorage.removeItem(STORAGE_KEYS.user);
      document.cookie = 'laundry_token=; Max-Age=0; path=/';
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/q/')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export function extractError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: ApiError } | undefined;
    if (data?.error) return data.error;
    return { code: 'NETWORK', message: err.message };
  }
  if (err instanceof Error) return { code: 'UNKNOWN', message: err.message };
  return { code: 'UNKNOWN', message: 'Đã xảy ra lỗi không xác định' };
}

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>) {
  const { data } = await promise;
  return data.data;
}
