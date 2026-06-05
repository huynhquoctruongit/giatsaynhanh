'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ClipboardList,
  Eye,
  EyeOff,
  Package2,
  Sparkles,
  Truck,
  TrendingUp,
  Wallet,
  Warehouse,
  BarChart2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { PageHeader } from '@/components/common/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { orderApi } from '@/services/api/order.api';
import { reportApi } from '@/services/api/report.api';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function DashboardPage() {
  const [showFinancial, setShowFinancial] = useState(true);

  const ordersQuery = useQuery({
    queryKey: ['orders', 'recent'],
    queryFn: () => orderApi.list({ page: 1, pageSize: 10 }),
  });

  const dashboardQuery = useQuery({
    queryKey: ['report', 'dashboard'],
    queryFn: () => reportApi.dashboard(),
  });

  const report = dashboardQuery.data;

  const stats = [
    {
      label: 'Doanh thu hôm nay',
      value: report?.revenue ?? 0,
      isCurrency: true,
      icon: Wallet,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Đã thu hôm nay',
      value: report?.profit ?? 0,
      isCurrency: true,
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Đơn mới',
      value: report?.newOrders ?? 0,
      isCurrency: false,
      icon: ClipboardList,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Đã giao',
      value: report?.deliveredOrders ?? 0,
      isCurrency: false,
      icon: Package2,
      color: 'bg-violet-50 text-violet-600',
    },
  ];

  const shortcuts = [
    { href: '/admin/orders/new', label: 'Tạo đơn', icon: Sparkles, color: 'bg-blue-50 text-blue-600' },
    { href: '/inventory', label: 'Xem kho', icon: Warehouse, color: 'bg-amber-50 text-amber-600' },
    { href: '/finance', label: 'Thu chi', icon: Wallet, color: 'bg-emerald-50 text-emerald-600' },
    { href: '/reports', label: 'Báo cáo', icon: BarChart2, color: 'bg-violet-50 text-violet-600' },
    { href: '/admin/orders', label: 'Đơn hàng', icon: ClipboardList, color: 'bg-pink-50 text-pink-600' },
    { href: '/debts', label: 'Sổ nợ', icon: Truck, color: 'bg-rose-50 text-rose-600' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan"
        description="Theo dõi nhanh đơn hàng và hoạt động kinh doanh"
        actions={
          <Button asChild>
            <Link href="/admin/orders/new">Tạo đơn mới</Link>
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          const isFinancial = s.isCurrency;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">
                      {dashboardQuery.isLoading
                        ? '—'
                        : isFinancial && !showFinancial
                          ? '••••'
                          : isFinancial
                            ? formatCurrency(s.value)
                            : s.value}
                    </p>
                    {isFinancial && (
                      <button
                        onClick={() => setShowFinancial((v) => !v)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {showFinancial ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Đơn hàng gần đây</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/orders" className="gap-1">
                Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {ordersQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))
            ) : ordersQuery.data?.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Chưa có đơn nào
              </p>
            ) : (
              ordersQuery.data?.items.slice(0, 6).map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition hover:border-primary/40 hover:bg-accent"
                >
                  <div>
                    <p className="text-sm font-semibold">{o.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.customer?.name} · {formatDateTime(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {formatCurrency(o.totalAmount)}
                    </span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Todo list */}
          {report?.todoList && report.todoList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cần xử lý</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {report.todoList.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2"
                  >
                    <p className="text-sm text-amber-800">{item.label}</p>
                    <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">
                      {item.count}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick shortcuts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Truy cập nhanh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {shortcuts.map((s) => {
                  const Icon = s.icon;
                  return (
                    <Link
                      key={s.href}
                      href={s.href}
                      className="flex flex-col items-center gap-1.5 rounded-lg border p-3 transition hover:border-primary/40 hover:bg-accent"
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-center text-xs font-medium">{s.label}</span>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
