'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlatformAuth } from '@/hooks/use-platform-auth';

export default function PlatformIndexPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = usePlatformAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated ? '/platform/shops' : '/platform/login');
  }, [isAuthenticated, isLoading, router]);

  return null;
}
