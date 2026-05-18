'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { STORAGE_KEYS } from '@/helpers/constants/storage-keys';
import { authApi, type LoginPayload } from '@/services/api/auth.api';
import type { User } from '@/types/api';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const setTokenCookie = (token: string) => {
  document.cookie = `laundry_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
};

const clearTokenCookie = () => {
  document.cookie = 'laundry_token=; path=/; max-age=0; SameSite=Lax';
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEYS.user);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        window.localStorage.removeItem(STORAGE_KEYS.user);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await authApi.login(payload);
    window.localStorage.setItem(STORAGE_KEYS.token, data.token);
    window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
    setTokenCookie(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEYS.token);
    window.localStorage.removeItem(STORAGE_KEYS.user);
    clearTokenCookie();
    setUser(null);
    router.replace('/login');
  }, [router]);

  const refresh = useCallback(async () => {
    try {
      const data = await authApi.me();
      window.localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data));
      setUser(data);
    } catch {
      logout();
    }
  }, [logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refresh,
    }),
    [user, isLoading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
