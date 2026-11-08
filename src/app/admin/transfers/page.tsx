'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Hash, Landmark, Search } from 'lucide-react';
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
import { bankApi } from '@/services/api/bank.api';
import { useDebounce } from '@/hooks/use-debounce';
import { vnDateStr } from '@/lib/promo';
import { cn, formatCurrency } from '@/lib/utils';

const PAGE_SIZE = 50;
const DAY_MS = 24 * 60 * 60 * 1000;

type Preset = 'today' | 'yesterday' | '7days' | 'month';

/** Khoảng ngày (YYYY-MM-DD, giờ VN) cho từng nút chọn nhanh */
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
function formatTxnTime(value: string) {
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

export default function TransfersPage() {
  const initial = presetRange('today');
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search.trim());
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['bank', 'history', { from, to, q: debounced, page }],
    queryFn: () =>
      bankApi.history({
        from: from || undefined,
        to: to || undefined,
        q: debounced || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  });

  const data = query.data;
  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));
  const activePreset = PRESETS.find((p) => {
    const r = presetRange(p.v);
    return r.from === from && r.to === to;
  })?.v;

  function applyPreset(p: Preset) {
    const r = presetRange(p);
    setFrom(r.from);
    setTo(r.to);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch sử chuyển khoản"
        description="Tiền khách chuyển khoản vào tài khoản của tiệm"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Card>
          <CardContent className="flex flex-col items-start gap-2 p-3 md:flex-row md:items-center md:gap-4 md:p-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 md:h-12 md:w-12">
              <Landmark className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground md:text-sm">Tổng tiền nhận</p>
              <p className="whitespace-nowrap text-lg font-bold text-emerald-700 md:text-2xl">
                {query.isLoading ? '—' : formatCurrency(data?.total ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-start gap-2 p-3 md:flex-row md:items-center md:gap-4 md:p-6">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 md:h-12 md:w-12">
              <Hash className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground md:text-sm">Số giao dịch</p>
              <p className="text-lg font-bold md:text-2xl">
                {query.isLoading ? '—' : (data?.count ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="space-y-4 p-4">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Tìm nội dung, người chuyển, mã đơn…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Date filter — mặc định Hôm nay */}
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.v}
              onClick={() => applyPreset(p.v)}
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
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              aria-label="Từ ngày"
            />
            <span className="text-sm text-muted-foreground">→</span>
            <Input
              type="date"
              className="w-40"
              value={to}
              min={from || undefined}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              aria-label="Đến ngày"
            />
          </div>
        </div>

        {/* Table */}
        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="Không có chuyển khoản nào"
            description={debounced ? 'Thử từ khoá khác hoặc đổi khoảng ngày' : 'Thử chọn khoảng ngày khác'}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead>Người chuyển</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead>Đơn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatTxnTime(t.transactionAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold text-emerald-700">
                    +{formatCurrency(t.amount)}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{t.counterName || '-'}</p>
                    {t.counterAccount && (
                      <p className="text-xs text-muted-foreground">{t.counterAccount}</p>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs break-words text-sm text-muted-foreground">
                    {t.content || '-'}
                  </TableCell>
                  <TableCell>
                    {t.order ? (
                      <Link
                        href={`/admin/orders/${t.order.id}`}
                        className="inline-flex flex-col hover:underline"
                      >
                        <span className="font-mono text-xs font-semibold text-primary">
                          {t.order.code}
                        </span>
                        {t.order.customerName && (
                          <span className="text-xs text-muted-foreground">
                            {t.order.customerName}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">Chưa khớp</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {data && data.count > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-2 pt-2">
            <p className="text-sm text-muted-foreground">
              Trang {page}/{totalPages} · {data.count} giao dịch
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || query.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || query.isFetching}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
