'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
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

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('financial');
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const d = new Date();
                setTo(d.toISOString().split('T')[0]);
                d.setDate(1);
                setFrom(d.toISOString().split('T')[0]);
              }}
            >
              Tháng này
            </Button>
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
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Doanh thu</p>
                      <p className="text-xl font-bold text-emerald-700">
                        {formatCurrency(financialQuery.data?.revenue ?? 0)}
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
                <Card>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lợi nhuận</p>
                      <p className={`text-xl font-bold ${(financialQuery.data?.profit ?? 0) >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                        {formatCurrency(financialQuery.data?.profit ?? 0)}
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

              {/* Daily revenue */}
              {(financialQuery.data?.dailyRevenue?.length ?? 0) > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Doanh thu theo ngày</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ngày</TableHead>
                          <TableHead className="text-right">Doanh thu</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financialQuery.data?.dailyRevenue.map((d) => (
                          <TableRow key={d.date}>
                            <TableCell>{formatDate(d.date)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(d.revenue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
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
