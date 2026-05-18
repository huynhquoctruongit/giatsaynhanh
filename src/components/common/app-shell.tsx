'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  ScanLine,
  LogOut,
  Menu,
  Truck,
  Warehouse,
  Wallet,
  BookOpen,
  Clock,
  BarChart2,
  Settings,
  UserCog,
  CalendarClock,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/orders', label: 'Đơn hàng', icon: Package },
  { href: '/bookings', label: 'Đặt lịch', icon: CalendarClock },
  { href: '/customers', label: 'Khách hàng', icon: Users },
  { href: '/suppliers', label: 'Nhà cung cấp', icon: Truck },
  { href: '/products', label: 'Sản phẩm', icon: ShoppingBag },
  { href: '/inventory', label: 'Kho hàng', icon: Warehouse },
  { href: '/finance', label: 'Thu chi', icon: Wallet },
  { href: '/debts', label: 'Sổ nợ', icon: BookOpen },
  { href: '/shifts', label: 'Ca làm việc', icon: Clock },
  { href: '/reports', label: 'Báo cáo', icon: BarChart2 },
  { href: '/scanner', label: 'Quét QR', icon: ScanLine },
];

const ADMIN_NAV_ITEMS = [
  { href: '/staff', label: 'Nhân viên', icon: UserCog },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const allNavItems = isAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r bg-background transition-transform md:relative md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Laundry QR</p>
            <p className="text-xs text-muted-foreground">Quản lý giặt sấy</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {allNavItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-8">
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {user?.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.role}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/orders/new')}>
                Tạo đơn mới
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} className="text-rose-600">
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
