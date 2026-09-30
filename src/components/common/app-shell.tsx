'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  PackageSearch,
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
  HandCoins,
  Banknote,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { SubscriptionBanner } from '@/components/common/subscription-banner';
import { TimeClockButton } from '@/components/common/time-clock-button';
import { CashClosingButton } from '@/components/common/cash-closing-button';
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
  { href: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Đơn hàng', icon: Package },
  { href: '/admin/audit', label: 'Rà soát đơn', icon: PackageSearch },
  { href: '/admin/bookings', label: 'Đặt lịch', icon: CalendarClock },
  { href: '/admin/order-debts', label: 'Đơn nợ', icon: HandCoins },
  { href: '/admin/customers', label: 'Khách hàng', icon: Users },
  { href: '/admin/suppliers', label: 'Nhà cung cấp', icon: Truck },
  { href: '/admin/products', label: 'Dịch vụ', icon: ShoppingBag },
  { href: '/admin/inventory', label: 'Kho hàng', icon: Warehouse },
  { href: '/admin/finance', label: 'Thu chi', icon: Wallet },
  { href: '/admin/debts', label: 'Sổ nợ', icon: BookOpen },
  { href: '/admin/shifts', label: 'Ca làm việc', icon: Clock },
  { href: '/admin/cash-closing', label: 'Chốt két', icon: Banknote },
  { href: '/admin/reports', label: 'Báo cáo', icon: BarChart2 },
  { href: '/admin/scanner', label: 'Quét QR', icon: ScanLine },
];

const ADMIN_NAV_ITEMS = [
  { href: '/admin/staff', label: 'Nhân viên', icon: UserCog },
  { href: '/admin/settings', label: 'Cài đặt', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const allNavItems = isAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;
  // Tiêu đề trang hiện trên header điện thoại (giống header app)
  const currentLabel =
    allNavItems.find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))?.label ?? 'Laundry QR';

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

      {/* min-w-0: không cho bảng rộng đẩy cả trang tràn ngang trên điện thoại */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 px-2 backdrop-blur md:h-16 md:gap-3 md:px-8">
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <p className="min-w-0 flex-1 truncate text-lg font-bold md:hidden">{currentLabel}</p>
          {/* Màn hình rộng / POS: nút Chốt két ở giữa header */}
          <div className="hidden flex-1 md:block" />
          <CashClosingButton placement="header" />
          <div className="hidden flex-1 md:block" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {user?.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.role}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin/orders/new')}>
                Tạo đơn mới
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} className="text-rose-600">
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <SubscriptionBanner />

        {/* pb-24 trên điện thoại: chừa chỗ cho nút chấm công nổi */}
        <main className="flex-1 px-3 pb-24 pt-4 md:px-8 md:py-8">{children}</main>
      </div>

      {/* Nút chấm công nổi trên mọi trang quản lý */}
      <TimeClockButton />
      {/* Điện thoại: nút chốt két nổi ngay trên nút Vào ca */}
      <CashClosingButton placement="fab" />
    </div>
  );
}
