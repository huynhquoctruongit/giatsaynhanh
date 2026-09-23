import axios, { type AxiosInstance } from 'axios';
import { PLATFORM_STORAGE_KEYS } from '@/helpers/constants/storage-keys';

const baseURL = 'https://laundry-qr-backend.onrender.com/api';

// Axios instance riêng cho platform-admin — không dùng chung apiClient vì
// token/khoá localStorage khác, và 401 ở đây phải văng về /platform/login
// chứ không phải /login (luồng nhân viên tiệm).
export const platformClient: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

platformClient.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;
  const token = window.localStorage.getItem(PLATFORM_STORAGE_KEYS.token);
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

platformClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (axios.isAxiosError(err) && err.response?.status === 401 && typeof window !== 'undefined') {
      window.localStorage.removeItem(PLATFORM_STORAGE_KEYS.token);
      window.localStorage.removeItem(PLATFORM_STORAGE_KEYS.admin);
      const path = window.location.pathname;
      if (!path.startsWith('/platform/login')) {
        window.location.href = '/platform/login';
      }
    }
    return Promise.reject(err);
  },
);
