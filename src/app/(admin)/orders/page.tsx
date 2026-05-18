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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  ORDER_STATUS_LABEL,
  type OrderStatus,
} from '@/helpers/enums/order-status';
import { useDebounce } from '@/hooks/use-debounce';

const ALL = '__ALL__';

export default function OrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [status, setStatus] = useState<string>(ALL);

  const query = useQuery({
    queryKey: ['orders', { search: debounced, status }],
    queryFn: () =>
      orderApi.list({
        search: debounced || undefined,
        status: status === ALL ? undefined : (status as OrderStatus),
        pageSize: 50,
      }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đơn hàng"
        description="Quản lý toàn bộ đơn giặt sấy"
        actions={
          <Button asChild>
            <Link href="/orders/new">
              <Plus className="h-4 w-4" /> Tạo đơn
            </Link>
          </Button>
        }
      />

      <Card className="p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Tìm mã đơn, tên khách, SĐT…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tất cả trạng thái</SelectItem>
              {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {ORDER_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
                <TableHead>Mã đơn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="text-right">Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Tạo lúc</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data?.items.map((o) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/orders/${o.id}`)}
                >
                  <TableCell className="font-mono text-sm font-semibold text-primary">
                    {o.code}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{o.customer?.name ?? '-'}</p>
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
                    {formatDateTime(o.createdAt)}
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
