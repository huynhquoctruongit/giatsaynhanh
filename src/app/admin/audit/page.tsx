'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  History,
  Package,
  PackageSearch,
  RotateCcw,
  ScanLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { orderApi } from '@/services/api/order.api';
import { auditApi } from '@/services/api/audit.api';
import { extractError } from '@/services/api/client';
import { useAuth } from '@/hooks/use-auth';
import { cn, formatCurrency, matchScannedOrder, orderCodeSuffix } from '@/lib/utils';
import type { Order } from '@/types/api';

type BagState = 'pending' | 'verified' | 'anomaly';
interface AuditEntry {
  order: Order;
  state: BagState;
  /** Ai quét (từ máy chủ — có thể là máy khác) */
  auditedBy?: string;
  auditedAt?: string;
}

/** Đồng bộ kết quả quét giữa các máy mỗi … ms khi đang mở trang */
const SYNC_INTERVAL_MS = 3000;

const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function AuditPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanValue, setScanValue] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  // Quét trên máy này nhưng máy chủ chưa xác nhận → hiện ngay cho mượt
  const [optimistic, setOptimistic] = useState<Map<string, BagState>>(new Map());

  // Tải tất cả đơn đã giặt xong chờ khách lấy (READY) — bịch trên kệ
  const ordersQuery = useQuery({
    queryKey: ['orders', 'audit-pending'],
    queryFn: async () => {
      const result = await orderApi.list({ status: 'READY', pageSize: 1000 });
      return result.items;
    },
  });

  // Kết quả quét HÔM NAY của mọi máy — gọi lại liên tục để đồng bộ
  const auditsQuery = useQuery({
    queryKey: ['audits', 'today'],
    queryFn: () => auditApi.today(),
    refetchInterval: SYNC_INTERVAL_MS,
  });

  // Máy chủ đã xác nhận (hoặc máy khác "Bắt đầu lại") → bỏ bản tạm
  useEffect(() => {
    if (!auditsQuery.data) return;
    setOptimistic((prev) => {
      if (prev.size === 0) return prev;
      const serverCodes = new Set(auditsQuery.data.items.map((a) => a.order.code));
      const next = new Map([...prev].filter(([code]) => !serverCodes.has(code)));
      return next.size === prev.size ? prev : next;
    });
  }, [auditsQuery.data]);

  /** Máy chủ là nguồn chuẩn; optimistic chỉ lấp khoảng trễ của lần quét trên máy này. */
  const auditMap = useMemo(() => {
    const map = new Map<string, AuditEntry>();
    const server = new Map((auditsQuery.data?.items ?? []).map((a) => [a.order.code, a]));
    for (const o of ordersQuery.data ?? []) {
      const a = server.get(o.code);
      map.set(o.code, {
        order: o,
        state: a ? (a.result === 'ANOMALY' ? 'anomaly' : 'verified') : optimistic.get(o.code) ?? 'pending',
        auditedBy: a?.auditedBy.name,
        auditedAt: a?.auditedAt,
      });
    }
    for (const a of auditsQuery.data?.items ?? []) {
      if (a.result === 'ANOMALY' && !map.has(a.order.code)) {
        map.set(a.order.code, {
          order: a.order as unknown as Order,
          state: 'anomaly',
          auditedBy: a.auditedBy.name,
          auditedAt: a.auditedAt,
        });
      }
    }
    return map;
  }, [ordersQuery.data, auditsQuery.data, optimistic]);

  // Giữ focus ô quét
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /** Gửi kết quả quét lên máy chủ; bịch đã được máy khác quét → báo người quét trước */
  async function pushAudit(order: Pick<Order, 'id'>, result: 'VERIFIED' | 'ANOMALY') {
    try {
      const res = await auditApi.mark(order.id, result);
      if (res.duplicate) {
        toast.info(`${res.audit.auditedBy.name} đã quét bịch này lúc ${hhmm(res.audit.auditedAt)}`, {
          description: res.audit.order.customer?.name ?? res.audit.order.code,
        });
      }
    } catch (err) {
      toast.error('Chưa lưu được lần quét', { description: extractError(err).message });
    } finally {
      queryClient.invalidateQueries({ queryKey: ['audits', 'today'] });
    }
  }

  async function processScan(raw: string) {
    const code = raw.trim();
    if (code.length < 2) return;

    // Mã quét có thể là mã đầy đủ hoặc đuôi mã in trên bịch
    const v = code.toUpperCase();
    const key = [...auditMap.keys()].find((k) => k.toUpperCase() === v || orderCodeSuffix(k).toUpperCase() === v);
    if (key) {
      setLastScanned(key);
      const e = auditMap.get(key)!;
      if (e.state === 'verified') {
        toast.info(
          e.auditedBy
            ? `${e.auditedBy} đã quét bịch này${e.auditedAt ? ` lúc ${hhmm(e.auditedAt)}` : ''}`
            : 'Bịch này đã quét rồi',
          { description: e.order.customer?.name ?? key },
        );
        return;
      }
      if (e.state === 'anomaly') return;
      setOptimistic((prev) => new Map(prev).set(key, 'verified'));
      void pushAudit(e.order, 'VERIFIED');
      return;
    }

    setLastScanned(code);
    // Không có trong list → tra cứu trạng thái thực
    try {
      const result = await orderApi.list({ search: code, pageSize: 5 });
      const found = matchScannedOrder(result.items, code);
      if (!found) {
        toast.error(`Không tìm thấy đơn: ${code}`);
        return;
      }
      if (found.status === 'DELIVERED') {
        // Bất thường: hệ thống ghi đã giao nhưng đồ vẫn trên kệ → ghi lên máy chủ cho mọi máy thấy
        setLastScanned(found.code);
        void pushAudit(found, 'ANOMALY');
        toast.warning(`Bất thường: ${found.code} đã được đánh dấu giao nhưng vẫn trên kệ`);
        return;
      }
      if (found.status === 'CANCELLED') {
        toast.error(`Đơn đã huỷ: ${found.code}`);
        return;
      }
      toast.info(`Đơn đang ở trạng thái ${found.status}`, { description: found.customer?.name ?? found.code });
    } catch {
      toast.error('Lỗi tra cứu đơn');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = scanValue;
      setScanValue('');
      void processScan(v);
    }
  }

  async function resetAudit() {
    if (!window.confirm('Bắt đầu rà soát lại?\nXoá kết quả quét hôm nay trên TẤT CẢ các máy (điện thoại + máy quét).')) return;
    try {
      await auditApi.resetToday();
      setOptimistic(new Map());
      setLastScanned(null);
      queryClient.invalidateQueries({ queryKey: ['audits', 'today'] });
      toast.success('Đã reset rà soát (mọi máy)');
    } catch (err) {
      toast.error(extractError(err).message);
    }
    inputRef.current?.focus();
  }

  const entries = useMemo(() => {
    const arr = Array.from(auditMap.values());
    const order: Record<BagState, number> = { anomaly: 0, pending: 1, verified: 2 };
    arr.sort((a, b) => order[a.state] - order[b.state]);
    return arr;
  }, [auditMap]);

  const stats = useMemo(() => {
    let sC = 0, sA = 0, pC = 0, pA = 0, aC = 0, aA = 0;
    for (const e of entries) {
      const amt = Number(e.order.totalAmount);
      if (e.state === 'verified') { sC++; sA += amt; }
      else if (e.state === 'anomaly') { aC++; aA += amt; }
      else { pC++; pA += amt; }
    }
    return { sC, sA, pC, pA, aC, aA };
  }, [entries]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rà soát đơn cuối ngày"
        description="Quét lần lượt từng bịch trên kệ để đối chiếu. KHÔNG hoàn thành đơn — chỉ kiểm tra."
        actions={
          <Button variant="outline" onClick={resetAudit}>
            <RotateCcw className="h-4 w-4" /> Bắt đầu lại
          </Button>
        }
      />

      {/* Ô quét USB */}
      <Card className="p-4">
        <div className="relative">
          <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            className="pl-9 text-base"
            placeholder="Quét mã đơn bằng máy quét USB (hoặc gõ mã rồi Enter)…"
            value={scanValue}
            onChange={(e) => setScanValue(e.target.value)}
            onKeyDown={handleKeyDown}
            // Ô này tự nhận mã quét → máy quét toàn cục không can thiệp
            data-scan-own
            onBlur={() => setTimeout(() => inputRef.current?.focus(), 50)}
            autoFocus
          />
        </div>
      </Card>

      {/* Thống kê */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Đã quét" count={stats.sC} amount={stats.sA} tone="green" />
        <StatCard label="Chưa quét" count={stats.pC} amount={stats.pA} tone="amber" />
        <StatCard label="Bất thường" count={stats.aC} amount={stats.aA} tone="rose" />
      </div>

      {/* Lưới bịch */}
      {ordersQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : ordersQuery.isError ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
          <p className="mt-2 text-sm text-muted-foreground">Không tải được dữ liệu. Tải lại trang.</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 font-medium">Không có bịch nào trên kệ</p>
          <p className="text-sm text-muted-foreground">Mọi đơn đã được giao hoặc chưa có đơn nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {entries.map((e) => (
            <BagCard key={e.order.code} entry={e} pulse={lastScanned === e.order.code} />
          ))}
        </div>
      )}

      {/* Chủ tiệm: lịch sử rà soát theo ngày */}
      {user?.role === 'ADMIN' && <AuditHistory />}
    </div>
  );
}

function AuditHistory() {
  const [cursor, setCursor] = useState(() => new Date());
  const month = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
  const query = useQuery({ queryKey: ['audits', 'summary', month], queryFn: () => auditApi.summary(month) });
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-semibold">
          <History className="h-4 w-4" /> Lịch sử rà soát
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">{month.slice(5)}/{month.slice(0, 4)}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {query.isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : !query.data || query.data.days.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có ngày nào rà soát trong tháng.</p>
      ) : (
        <div className="space-y-2">
          {query.data.days.map((d) => (
            <div key={d.date} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {d.date.split('-').reverse().slice(0, 2).join('/')} · {hhmm(d.firstAt)}–{hhmm(d.lastAt)}
                </p>
                <p className="text-xs text-muted-foreground">{d.users.map((u) => `${u.name} ${u.count} bịch`).join(' · ')}</p>
              </div>
              <span className="font-bold text-emerald-600">{d.verified} bịch</span>
              {d.anomaly > 0 && <span className="font-semibold text-rose-600">{d.anomaly} bất thường</span>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function StatCard({
  label, count, amount, tone,
}: { label: string; count: number; amount: number; tone: 'green' | 'amber' | 'rose' }) {
  const toneClass = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  }[tone];
  return (
    <div className={cn('rounded-lg border p-3 text-center', toneClass)}>
      <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-lg font-extrabold">{count} đơn</p>
      <p className="text-sm font-semibold">{formatCurrency(amount)}</p>
    </div>
  );
}

function BagCard({ entry, pulse }: { entry: AuditEntry; pulse: boolean }) {
  const { order, state } = entry;
  const stateClass = {
    pending: 'bg-background border-border',
    verified: 'bg-emerald-50 border-emerald-400',
    anomaly: 'bg-rose-50 border-rose-400',
  }[state];
  const iconColor = {
    pending: 'text-muted-foreground',
    verified: 'text-emerald-600',
    anomaly: 'text-rose-600',
  }[state];
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center gap-1 rounded-lg border-2 p-3 transition-all',
        stateClass,
        pulse && 'ring-2 ring-primary ring-offset-1',
      )}
    >
      {state === 'verified' && (
        <CheckCircle2 className="absolute right-1.5 top-1.5 h-4 w-4 text-emerald-600" />
      )}
      {state === 'anomaly' && (
        <AlertTriangle className="absolute right-1.5 top-1.5 h-4 w-4 text-rose-600" />
      )}
      <PackageSearch className={cn('h-7 w-7', iconColor)} />
      <p className="line-clamp-1 text-center text-sm font-bold">{order.customer?.name ?? '—'}</p>
      <p className="font-mono text-[10px] text-muted-foreground">{order.code}</p>
      <p className={cn('text-xs font-semibold', iconColor)}>{formatCurrency(Number(order.totalAmount))}</p>
      {entry.auditedBy && (
        <p className="line-clamp-1 text-[10px] text-muted-foreground">
          {entry.auditedBy}
          {entry.auditedAt ? ` · ${hhmm(entry.auditedAt)}` : ''}
        </p>
      )}
    </div>
  );
}
