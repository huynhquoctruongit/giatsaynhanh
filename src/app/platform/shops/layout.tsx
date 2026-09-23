'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlatformAuth } from '@/hooks/use-platform-auth';

export default function PlatformShopsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { admin, isAuthenticated, isLoading, logout } = usePlatformAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/platform/login');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-2 p-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Platform Admin
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{admin?.email}</span>
            <Button variant="ghost" size="icon" title="Đăng xuất" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
