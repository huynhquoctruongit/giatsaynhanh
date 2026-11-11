'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Hash, Trash2 } from 'lucide-react';
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
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from '@/helpers/enums/order-status';
import { vnDateStr } from '@/lib/promo';
import { cn, formatCurrency } from '@/lib/utils';

const DAY_MS = 24 * 60 * 60 * 1000;
type Preset = 'today' | 'yesterday' | '7days' | 'month';

function presetRange(p: Preset): { from: string; to: string } {
  const now = new Date();
  const today = vnDateStr(now);
  switch (p) {
    case 'yesterday': {
      const y = vnDateStr(new Date(now.getTime() - DAY_MS));
      return { from: y, to: y };
    }
    case '7days':
      return { from: vnDateStr(new Date(now.getTime() - 6 * DAY_MS)), to: today };
    case 'month':
      return { from: `${today.slice(0, 7)}-01`, to: today };
    default:
      return { from: today, to: today };
  }
}

const PRESETS: { v: Preset; label: string }[] = [
  { v: 'today', label: 'Hôm nay' },
  { v: 'yesterday', label: 'Hôm qua' },
  { v: '7days', label: '7 ngày' },
  { v: 'month', label: 'Tháng này' },
];

/** dd/MM HH:mm theo giờ VN */
function formatTime(value: string) {
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(value));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('day')}/${get('month')} ${get('hour')}:${get('minute')}`;
}

export default function DeletedOrdersPage() {
  const initial = presetRange('today');
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  const query = useQuery({
    queryKey: ['orders', 'deleted', { from, to }],
    queryFn: () => orderApi.deleted({ from: from || undefined, to: to || undefined }),
    placeholderData: (prev) => prev,
  });
  const data = query.data;
  const activePreset = PRESETS.find((p) => {
    const r = presetRange(p.v);
    return r.from === from && r.to === to;
  })?.v;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đơn đã xoá"
        description="Nhật ký các đơn bị xoá: ai xoá, lúc nào, đơn gồm những gì"
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Card>
          <CardContent className="flex flex-col items-start gap-2 p-3 md:flex-row md:items-center md:gap-4 md:p-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 md:h-12 md:w-12">
              <Hash className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground md:text-sm">Số đơn đã xoá</p>
              <p className="text-lg font-bold md:text-2xl">
                {query.isLoading ? '—' : (data?.count ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-start gap-2 p-3 md:flex-row md:items-center md:gap-4 md:p-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 md:h-12 md:w-12">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground md:text-sm">Tổng tiền các đơn</p>
              <p className="whitespace-nowrap text-lg font-bold text-rose-700 md:text-2xl">
                {query.isLoading ? '—' : formatCurrency(data?.totalAmount ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.v}
              onClick={() => {
                const r = presetRange(p.v);
                setFrom(r.from);
                setTo(r.to);
              }}
              className={cn(
                'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                activePreset === p.v
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              className="w-40"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              aria-label="Từ ngày"
            />
            <span className="text-sm text-muted-foreground">→</span>
            <Input
              type="date"
              className="w-40"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              aria-label="Đến ngày"
            />
          </div>
        </div>

        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="Không có đơn nào bị xoá" description="Thử chọn khoảng ngày khác" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Xoá lúc</TableHead>
                <TableHead>Người xoá</TableHead>
                <TableHead>Đơn</TableHead>
                <TableHead>Khách</TableHead>
                <TableHead>Dịch vụ</TableHead>
                <TableHead className="text-right">Tổng tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="whitespace-nowrap text-sm">{formatTime(o.deletedAt)}</TableCell>
                  <TableCell className="text-sm font-medium">{o.deletedByName || '-'}</TableCell>
                  <TableCell>
                    <p className="font-mono text-xs font-semibold">{o.code}</p>
                    <p className="text-xs text-muted-foreground">Tạo {formatTime(o.orderCreatedAt)}</p>
                    <span
                      className={cn(
                        'mt-1 inline-block rounded border px-1.5 py-0.5 text-[11px]',
                        ORDER_STATUS_COLOR[o.status],
                      )}
                    >
                      {ORDER_STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{o.customerName || '-'}</p>
                    {o.customerPhone && (
                      <p className="text-xs text-muted-foreground">{o.customerPhone}</p>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs text-sm text-muted-foreground">
                    {o.items.map((i) => `${i.name} ×${i.quantity}`).join(', ') || '-'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold">
                    {formatCurrency(o.totalAmount)}
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
