'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Wallet, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { reportApi } from '@/services/api/report.api';
import { formatCurrency } from '@/lib/utils';
import { ORDER_STATUS_LABEL } from '@/helpers/enums/order-status';

// Định dạng ngày theo GIỜ ĐỊA PHƯƠNG (không dùng toISOString để tránh lệch ngày
// với máy ở múi giờ +7).
const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// Gửi cho API: from = đầu ngày, to = cuối ngày (theo giờ địa phương) → ISO,
// nếu không backend lọc lte 00:00 sẽ bỏ sót cả ngày.
const startIso = (date: string) => new Date(`${date}T00:00:00`).toISOString();
const endIso = (date: string) => new Date(`${date}T23:59:59.999`).toISOString();

// Rút gọn tiền cho nhãn cột: 630500 → "631k", 1250000 → "1.3tr"
function formatCompact(v: number): string {
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)}tr`;
  }
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
  return String(v);
}

function DailyBarChart({ data }: { data: { date: string; amount: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có dữ liệu</p>;
  }
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-2" style={{ height: 180 }}>
        {data.map((d) => {
          const day = new Date(d.date);
          const h = Math.max(2, Math.round((d.amount / max) * 140));
          return (
            <div key={d.date} className="flex w-11 shrink-0 flex-col items-center">
              <span className="mb-1 text-[10px] font-semibold text-foreground">
                {d.amount > 0 ? formatCompact(d.amount) : ''}
              </span>
              <div className="flex flex-1 items-end">
                <div
                  className="w-6 rounded-md bg-blue-600"
                  style={{ height: h }}
                />
              </div>
              <span className="mt-1.5 text-[10px] text-muted-foreground">
                {day.getDate().toString().padStart(2, '0')}/
                {(day.getMonth() + 1).toString().padStart(2, '0')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return ymd(d);
  });
  const [to, setTo] = useState(() => ymd(new Date()));
  const [preset, setPreset] = useState<string>('month'); // mặc định "Tháng này"

  function applyPreset(p: 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth') {
    setPreset(p);
    const now = new Date();
    let f = new Date(now);
    let t = new Date(now);
    if (p === 'today') {
      f = now;
    } else if (p === 'yesterday') {
      f = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      t = f;
    } else if (p === 'week') {
      const dow = (now.getDay() + 6) % 7; // Thứ 2 = 0
      f = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow);
    } else if (p === 'month') {
      f = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      f = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      t = new Date(now.getFullYear(), now.getMonth(), 0);
    }
    setFrom(ymd(f));
    setTo(ymd(t));
  }

  const range = { from: startIso(from), to: endIso(to) };

  const salesQuery = useQuery({
    queryKey: ['report', 'sales', { from, to }],
    queryFn: () => reportApi.sales(range),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Báo cáo bán hàng" description="Tổng hợp doanh số theo khoảng thời gian" />

      {/* Bộ lọc ngày */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { v: 'today', label: 'Hôm nay' },
            { v: 'yesterday', label: 'Hôm qua' },
            { v: 'week', label: 'Tuần này' },
            { v: 'month', label: 'Tháng này' },
            { v: 'lastMonth', label: 'Tháng trước' },
          ] as const
        ).map((p) => (
          <Button
            key={p.v}
            variant={preset === p.v ? 'default' : 'outline'}
            size="sm"
            onClick={() => applyPreset(p.v)}
          >
            {p.label}
          </Button>
        ))}
        <Input
          type="date"
          className="w-40"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPreset('custom');
          }}
        />
        <span className="text-sm text-muted-foreground">—</span>
        <Input
          type="date"
          className="w-40"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPreset('custom');
          }}
        />
      </div>

      {salesQuery.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng đơn</p>
                  <p className="text-xl font-bold">{salesQuery.data?.totalOrders ?? 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Đã thu</p>
                  <p className="text-xl font-bold text-emerald-700">
                    {formatCurrency(salesQuery.data?.collected ?? 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Giá trị trung bình</p>
                  <p className="text-xl font-bold text-violet-700">
                    {formatCurrency(salesQuery.data?.avgOrderValue ?? 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Đã thu theo ngày */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Đã thu theo ngày</CardTitle>
            </CardHeader>
            <CardContent>
              <DailyBarChart data={salesQuery.data?.dailyCollected ?? []} />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Top products */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sản phẩm bán chạy</CardTitle>
              </CardHeader>
              <CardContent>
                {(salesQuery.data?.topProducts?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">Không có dữ liệu</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead className="text-right">SL</TableHead>
                        <TableHead className="text-right">Doanh thu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesQuery.data?.topProducts.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell>{p.name}</TableCell>
                          <TableCell className="text-right">{p.quantity}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(p.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Orders by status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Đơn hàng theo trạng thái</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(salesQuery.data?.ordersByStatus ?? {}).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Không có dữ liệu</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(salesQuery.data?.ordersByStatus ?? {}).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-sm">
                          {ORDER_STATUS_LABEL[status as keyof typeof ORDER_STATUS_LABEL] ?? status}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
