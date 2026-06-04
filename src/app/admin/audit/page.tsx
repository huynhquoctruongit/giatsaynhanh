'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
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
import { cn, formatCurrency } from '@/lib/utils';
import type { Order } from '@/types/api';

type BagState = 'pending' | 'verified' | 'anomaly';
interface AuditEntry {
  order: Order;
  state: BagState;
}

export default function AuditPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanValue, setScanValue] = useState('');
  const [auditMap, setAuditMap] = useState<Map<string, AuditEntry>>(new Map());
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  // Tải tất cả đơn còn trên kệ (bỏ DELIVERED + CANCELLED)
  const ordersQuery = useQuery({
    queryKey: ['orders', 'audit-pending'],
    queryFn: async () => {
      const result = await orderApi.list({ pageSize: 1000 });
      return result.items.filter(
        (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED',
      );
    },
  });

  // Khởi tạo map khi data về (giữ lại state đã scan + anomaly)
  useEffect(() => {
    if (!ordersQuery.data) return;
    setAuditMap((prev) => {
      const next = new Map<string, AuditEntry>();
      for (const o of ordersQuery.data) {
        const existing = prev.get(o.code);
        next.set(o.code, { order: o, state: existing?.state ?? 'pending' });
      }
      for (const [code, entry] of prev) {
        if (entry.state === 'anomaly' && !next.has(code)) next.set(code, entry);
      }
      return next;
    });
  }, [ordersQuery.data]);

  // Giữ focus ô quét
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function processScan(raw: string) {
    const code = raw.trim();
    if (code.length < 2) return;
    setLastScanned(code);

    const existing = auditMap.get(code);
    if (existing) {
      // Có trong list → đánh dấu đã quét (xanh)
      setAuditMap((prev) => {
        const next = new Map(prev);
        const e = next.get(code);
        if (e && e.state !== 'anomaly') next.set(code, { ...e, state: 'verified' });
        return next;
      });
      return;
    }

    // Không có trong list → tra cứu trạng thái thực
    try {
      const result = await orderApi.list({ search: code, pageSize: 5 });
      const found = result.items.find((o) => o.code === code);
      if (!found) {
        toast.error(`Không tìm thấy đơn: ${code}`);
        return;
      }
      if (found.status === 'DELIVERED') {
        // Bất thường: hệ thống ghi đã giao nhưng đồ vẫn trên kệ
        setAuditMap((prev) => {
          const next = new Map(prev);
          next.set(code, { order: found, state: 'anomaly' });
          return next;
        });
        toast.warning(`Bất thường: ${code} đã được đánh dấu giao nhưng vẫn trên kệ`);
        return;
      }
      if (found.status === 'CANCELLED') {
        toast.error(`Đơn đã huỷ: ${code}`);
        return;
      }
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

  function resetAudit() {
    setAuditMap((prev) => {
      const next = new Map<string, AuditEntry>();
      for (const [code, entry] of prev) {
        if (entry.state === 'anomaly') continue; // bỏ anomaly khi reset
        next.set(code, { ...entry, state: 'pending' });
      }
      return next;
    });
    setLastScanned(null);
    toast.success('Đã reset rà soát');
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
    </div>
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
    </div>
  );
}
