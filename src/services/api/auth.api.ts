import { apiClient, unwrap } from './client';
import type { User } from '@/types/api';

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
};
