import { apiClient, unwrap } from './client';
import type { LinkedShop, User } from '@/types/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    unwrap<LoginResponse>(apiClient.post('/auth/login', payload)),
  me: () => unwrap<User>(apiClient.get('/auth/me')),
  linkedShops: () => unwrap<LinkedShop[]>(apiClient.get('/auth/linked-shops')),
  linkShop: (payload: LoginPayload) =>
    unwrap<LinkedShop[]>(apiClient.post('/auth/linked-shops', payload)),
  unlinkShop: (shopId: string) =>
    unwrap<LinkedShop[]>(apiClient.delete(`/auth/linked-shops/${shopId}`)),
  switchShop: (shopId: string) =>
    unwrap<LoginResponse>(apiClient.post('/auth/switch-shop', { shopId })),
};
