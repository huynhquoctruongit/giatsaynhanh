'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingDown,
  Wallet,
  ShoppingCart,
  Package,
  AlertTriangle,
  BarChart2,
} from 'lucide-react';
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
import { formatCurrency, formatDate } from '@/lib/utils';
import { ORDER_STATUS_LABEL } from '@/helpers/enums/order-status';

type Tab = 'financial' | 'sales' | 'inventory';

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
  const [tab, setTab] = useState<Tab>('financial');
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);

  const ymd = (d: Date) => d.toISOString().split('T')[0];
  function applyPreset(p: 'today' | 'yesterday' | 'week' | 'month' | 'lastMonth') {
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

  const financialQuery = useQuery({
    queryKey: ['report', 'financial', { from, to }],
    queryFn: () => reportApi.financial({ from, to }),
    enabled: tab === 'financial',
  });

  const salesQuery = useQuery({
    queryKey: ['report', 'sales', { from, to }],
    queryFn: () => reportApi.sales({ from, to }),
    enabled: tab === 'sales',
  });

  const inventoryQuery = useQuery({
    queryKey: ['report', 'inventory'],
    queryFn: () => reportApi.inventory(),
    enabled: tab === 'inventory',
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: 'financial', label: 'Tài chính' },
    { key: 'sales', label: 'Bán hàng' },
    { key: 'inventory', label: 'Kho hàng' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo"
        description="Tổng hợp số liệu hoạt động kinh doanh"
      />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border bg-muted/30 p-1 gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${tab === t.key ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab !== 'inventory' && (
          <>
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
                variant="outline"
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
              onChange={(e) => setFrom(e.target.value)}
            />
            <span className="text-sm text-muted-foreground">—</span>
            <Input
              type="date"
              className="w-40"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </>
        )}
      </div>

      {/* Financial tab */}
      {tab === 'financial' && (
        <div className="space-y-6">
          {financialQuery.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lợi nhuận</p>
                      <p className="text-xl font-bold text-blue-700">
                        {formatCurrency(financialQuery.data?.collected ?? 0)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                      <TrendingDown className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Chi phí</p>
                      <p className="text-xl font-bold text-rose-700">
                        {formatCurrency(financialQuery.data?.expenses ?? 0)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Income by category */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Thu theo danh mục</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(financialQuery.data?.incomeByCategory ?? {}).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Không có dữ liệu</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(financialQuery.data?.incomeByCategory ?? {}).map(([cat, amount]) => (
                          <div key={cat} className="flex items-center justify-between">
                            <span className="text-sm">{cat}</span>
                            <span className="text-sm font-medium text-emerald-700">{formatCurrency(amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Expense by category */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Chi theo danh mục</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(financialQuery.data?.expenseByCategory ?? {}).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Không có dữ liệu</p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(financialQuery.data?.expenseByCategory ?? {}).map(([cat, amount]) => (
                          <div key={cat} className="flex items-center justify-between">
                            <span className="text-sm">{cat}</span>
                            <span className="text-sm font-medium text-rose-700">{formatCurrency(amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Lợi nhuận theo ngày */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lợi nhuận theo ngày</CardTitle>
                </CardHeader>
                <CardContent>
                  <DailyBarChart data={financialQuery.data?.dailyCollected ?? []} />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Sales tab */}
      {tab === 'sales' && (
        <div className="space-y-6">
          {salesQuery.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : (
            <>
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
                      <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                      <p className="text-xl font-bold text-emerald-700">
                        {formatCurrency(salesQuery.data?.totalRevenue ?? 0)}
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
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* Inventory tab */}
      {tab === 'inventory' && (
        <div className="space-y-6">
          {inventoryQuery.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tổng mặt hàng</p>
                      <p className="text-xl font-bold">{inventoryQuery.data?.totalItems ?? 0}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sắp hết hàng</p>
                      <p className="text-xl font-bold text-amber-700">
                        {inventoryQuery.data?.lowStockItems ?? 0}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Nhập kho gần đây</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(inventoryQuery.data?.recentImports?.length ?? 0) === 0 ? (
                      <p className="text-sm text-muted-foreground">Chưa có lịch sử</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ngày</TableHead>
                            <TableHead>Hàng hoá</TableHead>
                            <TableHead className="text-right">SL</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inventoryQuery.data?.recentImports.map((r, i) => (
                            <TableRow key={i}>
                              <TableCell>{formatDate(r.date)}</TableCell>
                              <TableCell>{r.itemName}</TableCell>
                              <TableCell className="text-right text-emerald-700">+{r.quantity}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Xuất kho gần đây</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(inventoryQuery.data?.recentExports?.length ?? 0) === 0 ? (
                      <p className="text-sm text-muted-foreground">Chưa có lịch sử</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ngày</TableHead>
                            <TableHead>Hàng hoá</TableHead>
                            <TableHead className="text-right">SL</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inventoryQuery.data?.recentExports.map((r, i) => (
                            <TableRow key={i}>
                              <TableCell>{formatDate(r.date)}</TableCell>
                              <TableCell>{r.itemName}</TableCell>
                              <TableCell className="text-right text-rose-700">-{r.quantity}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
