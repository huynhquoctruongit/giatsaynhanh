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
import { PLATFORM_STORAGE_KEYS } from '@/helpers/constants/storage-keys';
import { platformApi, type PlatformAdmin, type PlatformLoginPayload } from '@/services/api/platform.api';

interface PlatformAuthContextValue {
  admin: PlatformAdmin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: PlatformLoginPayload) => Promise<void>;
  logout: () => void;
}

const PlatformAuthContext = createContext<PlatformAuthContextValue | null>(null);

export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(PLATFORM_STORAGE_KEYS.admin);
    if (stored) {
      try {
        setAdmin(JSON.parse(stored));
      } catch {
        window.localStorage.removeItem(PLATFORM_STORAGE_KEYS.admin);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (payload: PlatformLoginPayload) => {
    const data = await platformApi.login(payload);
    window.localStorage.setItem(PLATFORM_STORAGE_KEYS.token, data.token);
    window.localStorage.setItem(PLATFORM_STORAGE_KEYS.admin, JSON.stringify(data.admin));
    setAdmin(data.admin);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(PLATFORM_STORAGE_KEYS.token);
    window.localStorage.removeItem(PLATFORM_STORAGE_KEYS.admin);
    setAdmin(null);
    router.replace('/platform/login');
  }, [router]);

  const value = useMemo<PlatformAuthContextValue>(
    () => ({
      admin,
      isAuthenticated: !!admin,
      isLoading,
      login,
      logout,
    }),
    [admin, isLoading, login, logout],
  );

  return <PlatformAuthContext.Provider value={value}>{children}</PlatformAuthContext.Provider>;
}

export function usePlatformAuth() {
  const ctx = useContext(PlatformAuthContext);
  if (!ctx) throw new Error('usePlatformAuth must be used within PlatformAuthProvider');
  return ctx;
}
