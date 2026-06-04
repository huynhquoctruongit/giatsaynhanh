'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { orderApi } from '@/services/api/order.api';
import { cn, formatCurrency, formatDateTime } from '@/lib/utils';
import {
  ORDER_STATUS_LABEL,
  type OrderStatus,
} from '@/helpers/enums/order-status';
import { useDebounce } from '@/hooks/use-debounce';

const ALL = '__ALL__';
const BOOKING = 'BOOKING';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: ALL, label: 'Tất cả' },
  { value: BOOKING, label: 'Đơn đặt' },
  ...( Object.entries(ORDER_STATUS_LABEL) as [OrderStatus, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
];

export default function OrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [status, setStatus] = useState<string>(ALL);

  // Lọc theo ngày — mặc định Hôm nay
  const [dateMode, setDateMode] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customDate, setCustomDate] = useState(''); // 'YYYY-MM-DD'

  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const activeDateStr =
    dateMode === 'today'
      ? ymd(new Date())
      : dateMode === 'yesterday'
        ? ymd(new Date(Date.now() - 86400000))
        : customDate || ymd(new Date());
  const dateFrom = new Date(`${activeDateStr}T00:00:00`).toISOString();
  const dateTo = new Date(`${activeDateStr}T23:59:59.999`).toISOString();

  const countsQuery = useQuery({
    queryKey: ['orders', 'status-counts'],
    queryFn: () => orderApi.statusCounts(),
    staleTime: 30_000,
  });

  const query = useQuery({
    queryKey: ['orders', { search: debounced, status, dateFrom, dateTo }],
    queryFn: () =>
      orderApi.list({
        search: debounced || undefined,
        status: status === ALL || status === BOOKING ? undefined : (status as OrderStatus),
        fromBooking: status === BOOKING ? true : undefined,
        // BE bỏ qua lọc ngày khi đang search (tìm xuyên suốt mọi ngày)
        dateFrom,
        dateTo,
        pageSize: 50,
      }),
  });

  const counts = countsQuery.data ?? {};
  // "Tất cả" không cộng key BOOKING (lát cắt riêng theo fromBooking)
  const totalAll = Object.entries(counts).reduce(
    (s, [k, n]) => (k === 'BOOKING' ? s : s + n),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đơn hàng"
        description="Quản lý toàn bộ đơn giặt sấy"
        actions={
          <Button asChild>
            <Link href="/admin/orders/new">
              <Plus className="h-4 w-4" /> Tạo đơn
            </Link>
          </Button>
        }
      />

      <Card className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Tìm mã đơn, tên khách, SĐT…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Date filter — mặc định Hôm nay */}
        <div className="flex flex-wrap items-center gap-2">
          {([
            { v: 'today', label: 'Hôm nay' },
            { v: 'yesterday', label: 'Hôm qua' },
          ] as const).map((d) => (
            <button
              key={d.v}
              onClick={() => setDateMode(d.v)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                dateMode === d.v
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
              )}
            >
              {d.label}
            </button>
          ))}
          <input
            type="date"
            value={dateMode === 'custom' ? customDate : ''}
            max={ymd(new Date())}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setDateMode(e.target.value ? 'custom' : 'today');
            }}
            className={cn(
              'rounded-full border px-3 py-1 text-sm font-medium outline-none transition-colors',
              dateMode === 'custom'
                ? 'border-primary text-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-primary/50',
            )}
          />
          {debounced && (
            <span className="text-xs text-muted-foreground">
              (đang tìm kiếm — bỏ qua lọc ngày)
            </span>
          )}
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => {
            const count = f.value === ALL ? totalAll : (counts[f.value] ?? 0);
            const isActive = status === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setStatus(f.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
                )}
              >
                {f.label}
                {count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-xs font-bold leading-none',
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Table */}
        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : query.data?.items.length === 0 ? (
          <EmptyState title="Không có đơn nào" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="text-right">Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Mã đơn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data?.items.map((o) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/admin/orders/${o.id}`)}
                >
                  {/* Khách hàng = thông tin chính (to + đậm) */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold">{o.customer?.name ?? '-'}</p>
                      {o.fromBooking && (
                        <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white">
                          SHIPPING
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {o.customer?.phone ?? ''}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {o.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(o.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {o.status === 'DELIVERED' && o.deliveredAt
                      ? `Giao ${formatDateTime(o.deliveredAt)}`
                      : formatDateTime(o.createdAt)}
                  </TableCell>
                  {/* Mã đơn = phụ (nhỏ, mờ) */}
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {o.code}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
