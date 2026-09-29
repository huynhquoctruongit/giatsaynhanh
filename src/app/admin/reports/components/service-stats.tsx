'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Layers,
  Receipt,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { reportApi, type ServiceStat } from '@/services/api/report.api';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

type SortKey = 'revenue' | 'orderCount' | 'customerCount';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'revenue', label: 'Doanh thu' },
  { key: 'orderCount', label: 'Số đơn' },
  { key: 'customerCount', label: 'Số khách' },
];

const pad2 = (n: number) => n.toString().padStart(2, '0');
const monthKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
const num = (v: number) => v.toLocaleString('vi-VN', { maximumFractionDigits: 1 });

/** SL hiển thị: có cân thì "x kg", không thì "x <đơn vị>". */
function usage(s: { quantity: number; weight: number }, unit: string | null) {
  if (s.weight > 0) return `${num(s.weight)} kg`;
  return `${num(s.quantity)} ${unit ?? 'cái'}`;
}

function GrowthBadge({ value, hasPrev }: { value: number | null; hasPrev: boolean }) {
  if (value === null) {
    return hasPrev ? null : (
      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">Mới</span>
    );
  }
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
      )}
      title="So với tháng trước"
    >
      <Icon className="h-3 w-3" />
      {up ? '+' : ''}
      {num(value)}%
    </span>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  extra,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  extra?: React.ReactNode;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', tone)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="whitespace-nowrap text-xl font-bold">{value}</p>
          {extra}
        </div>
      </CardContent>
    </Card>
  );
}

const RANK_TONES = ['bg-amber-400 text-white', 'bg-slate-400 text-white', 'bg-orange-400 text-white'];

function ServiceRow({
  service: s,
  rank,
  maxRevenue,
  open,
  onToggle,
}: {
  service: ServiceStat;
  rank: number;
  maxRevenue: number;
  open: boolean;
  onToggle: () => void;
}) {
  const barWidth = maxRevenue > 0 ? Math.max(2, (s.revenue / maxRevenue) * 100) : 0;
  return (
    <div className={cn('rounded-xl border bg-background transition', open && 'border-primary/40 shadow-sm')}>
      <button type="button" onClick={onToggle} className="w-full p-4 text-left">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
              RANK_TONES[rank - 1] ?? 'bg-muted text-muted-foreground',
            )}
          >
            {rank}
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate font-semibold">{s.name}</p>
                <GrowthBadge value={s.growth} hasPrev={s.prevRevenue > 0} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold">{formatCurrency(s.revenue)}</span>
                <span className="w-14 text-right text-sm font-semibold text-muted-foreground">{num(s.share)}%</span>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition', open && 'rotate-180')} />
              </div>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${barWidth}%` }} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
              <span><b className="text-foreground">{s.orderCount}</b> đơn</span>
              <span><b className="text-foreground">{s.customerCount}</b> khách</span>
              <span>Đã dùng <b className="text-foreground">{usage(s, s.unit)}</b></span>
              <span>TB <b className="text-foreground">{formatCurrency(s.avgPerOrder)}</b>/đơn</span>
              {s.prevRevenue > 0 && <span>Tháng trước {formatCurrency(s.prevRevenue)}</span>}
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t px-4 pb-4 pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Crown className="h-4 w-4 text-amber-500" /> Top {s.topCustomers.length} khách dùng nhiều nhất
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-2 font-medium">#</th>
                  <th className="py-2 pr-2 font-medium">Khách hàng</th>
                  <th className="py-2 pr-2 text-right font-medium">Số đơn</th>
                  <th className="py-2 pr-2 text-right font-medium">Đã dùng</th>
                  <th className="py-2 pr-2 text-right font-medium">Doanh thu</th>
                  <th className="py-2 text-right font-medium">Lần gần nhất</th>
                </tr>
              </thead>
              <tbody>
                {s.topCustomers.map((c, i) => (
                  <tr key={c.customerId} className="border-t">
                    <td className="py-2 pr-2 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 pr-2">
                      <p className="font-medium">{c.name}</p>
                      {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                    </td>
                    <td className="py-2 pr-2 text-right">{c.orderCount}</td>
                    <td className="py-2 pr-2 text-right">{usage(c, s.unit)}</td>
                    <td className="py-2 pr-2 text-right font-semibold">{formatCurrency(c.revenue)}</td>
                    <td className="py-2 text-right text-muted-foreground">{formatDate(c.lastAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/** Thống kê theo dịch vụ trong tháng: xếp hạng doanh thu + top 10 khách mỗi dịch vụ. */
export function ServiceStats() {
  const [cursor, setCursor] = useState(() => new Date());
  const [sort, setSort] = useState<SortKey>('revenue');
  const [search, setSearch] = useState('');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const month = monthKey(cursor);
  const isCurrentMonth = month === monthKey(new Date());

  const { data, isLoading } = useQuery({
    queryKey: ['report', 'services', month],
    queryFn: () => reportApi.services(month),
  });

  const services = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = (data?.services ?? []).filter((s) => !q || s.name.toLowerCase().includes(q));
    return [...list].sort((a, b) => b[sort] - a[sort] || b.revenue - a.revenue);
  }, [data, sort, search]);
  const maxRevenue = Math.max(0, ...(data?.services ?? []).map((s) => s.revenue));

  const shiftMonth = (delta: number) => {
    setOpenKey(null);
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  return (
    <div className="space-y-5">
      {/* Bộ lọc */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-32 text-center font-semibold">
            Tháng {pad2(cursor.getMonth() + 1)}/{cursor.getFullYear()}
          </span>
          <Button variant="outline" size="icon" onClick={() => shiftMonth(1)} disabled={isCurrentMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
          {SORTS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setSort(o.key)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition',
                sort === o.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm dịch vụ…"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !data || data.services.length === 0 ? (
        <EmptyState title="Chưa có đơn nào trong tháng này" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              icon={Wallet}
              tone="bg-emerald-50 text-emerald-600"
              label="Doanh thu dịch vụ"
              value={formatCurrency(data.totalRevenue)}
              extra={<GrowthBadge value={data.growth} hasPrev={data.prevTotalRevenue > 0} />}
            />
            <Kpi icon={Receipt} tone="bg-blue-50 text-blue-600" label="Số đơn" value={num(data.totalOrders)} />
            <Kpi icon={Users} tone="bg-violet-50 text-violet-600" label="Khách hàng" value={num(data.totalCustomers)} />
            <Kpi icon={Layers} tone="bg-amber-50 text-amber-600" label="Loại dịch vụ" value={num(data.serviceCount)} />
          </div>

          <div className="space-y-3">
            {services.map((s, i) => (
              <ServiceRow
                key={s.key}
                service={s}
                rank={i + 1}
                maxRevenue={maxRevenue}
                open={openKey === s.key}
                onToggle={() => setOpenKey((k) => (k === s.key ? null : s.key))}
              />
            ))}
            {services.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Không có dịch vụ khớp “{search}”</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            * Tính theo ngày tạo đơn, không gồm đơn đã huỷ. Doanh thu theo thành tiền từng dịch vụ (chưa trừ giảm
            giá của cả đơn). % tăng/giảm so với tháng trước. Bấm vào dịch vụ để xem top 10 khách.
          </p>
        </>
      )}
    </div>
  );
}
