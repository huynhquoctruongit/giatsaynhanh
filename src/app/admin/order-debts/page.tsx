'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle, HandCoins, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { orderApi } from '@/services/api/order.api';
import { extractError } from '@/services/api/client';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import type { Order } from '@/types/api';

export default function OrderDebtsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);

  const debtQuery = useQuery({
    queryKey: ['orders', 'debt'],
    queryFn: () => orderApi.list({ debt: true, pageSize: 200 }),
  });

  const items = debtQuery.data?.items ?? [];
  const totalDebt = items.reduce((sum, o) => sum + Number(o.totalAmount), 0);

  const filteredItems = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return items;
    return items.filter((o) => {
      const name = o.customer?.name?.toLowerCase() ?? '';
      const phone = o.customer?.phone?.toLowerCase() ?? '';
      const code = o.code.toLowerCase();
      return name.includes(q) || phone.includes(q) || code.includes(q);
    });
  }, [items, debounced]);

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; orders: Order[]; total: number }>();
    for (const o of filteredItems) {
      const key = o.customer?.id ?? o.customer?.phone ?? o.id;
      const group = map.get(key) ?? {
        name: o.customer?.name ?? '—',
        phone: o.customer?.phone ?? '',
        orders: [],
        total: 0,
      };
      group.orders.push(o);
      group.total += Number(o.totalAmount);
      map.set(key, group);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredItems]);

  const payMutation = useMutation({
    mutationFn: (id: string) => orderApi.setPayment(id, true),
    onSuccess: (order) => {
      toast.success(`Đã thu tiền đơn ${order.code}`);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', order.id] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  function confirmPay(orderId: string, customerName: string, code: string, amount: number) {
    if (
      confirm(
        `Khách "${customerName}" đã trả ${formatCurrency(amount)} cho đơn ${code}?\nTiền sẽ được cộng vào lợi nhuận.`,
      )
    ) {
      payMutation.mutate(orderId);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Đơn nợ" description="Các đơn đã giao nhưng chưa thu tiền" />

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <HandCoins className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tổng tiền đang nợ</p>
            <p className="text-xl font-bold text-rose-700">
              {debtQuery.isLoading ? '—' : formatCurrency(totalDebt)}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-extrabold text-rose-700">{items.length}</p>
            <p className="text-xs font-medium text-rose-700">đơn</p>
          </div>
        </CardContent>
      </Card>

      <Card className="p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Tìm tên khách, SĐT, mã đơn…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {debtQuery.isLoading ? (
        <Card className="p-4">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      ) : groups.length === 0 ? (
        <Card className="p-4">
          <EmptyState
            title={items.length === 0 ? 'Không có đơn nợ' : 'Không tìm thấy kết quả'}
            description={
              items.length === 0 ? 'Tất cả đơn đã thu tiền 🎉' : 'Thử tìm với từ khoá khác'
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={`${group.name}-${group.phone}`} className="overflow-hidden p-0">
              <div className="flex items-center gap-3 border-b bg-muted/40 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{group.name}</p>
                  <p className="text-xs text-muted-foreground">{group.phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-rose-700">{formatCurrency(group.total)}</p>
                  <p className="text-xs text-muted-foreground">{group.orders.length} đơn</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Ngày giao</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead className="w-40 text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell
                        className="cursor-pointer font-mono text-xs text-muted-foreground"
                        onClick={() => router.push(`/admin/orders/${o.id}`)}
                      >
                        {o.code}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(o.deliveredAt ?? o.createdAt)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-rose-700">
                        {formatCurrency(o.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={payMutation.isPending && payMutation.variables === o.id}
                          onClick={() =>
                            confirmPay(o.id, group.name, o.code, o.totalAmount)
                          }
                        >
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          Đã thanh toán
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
