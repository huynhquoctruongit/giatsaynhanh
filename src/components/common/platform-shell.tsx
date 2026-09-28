'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlatformAuth } from '@/hooks/use-platform-auth';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/platform/shops', label: 'Quản lý tiệm' },
  { href: '/platform/plans', label: 'Gói dịch vụ' },
];

/** Khung chung cho các trang platform-admin: chặn chưa đăng nhập + header + nav. */
export function PlatformShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Platform Admin
            </div>
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition',
                    pathname.startsWith(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{admin?.email}</span>
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
