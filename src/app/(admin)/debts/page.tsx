'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, CheckCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { debtApi, type CustomerDebt, type SupplierDebt, type DebtType } from '@/services/api/debt.api';
import { customerApi } from '@/services/api/customer.api';
import { supplierApi } from '@/services/api/supplier.api';
import { extractError } from '@/services/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';

type Tab = 'customers' | 'suppliers';
type FilterPaid = 'all' | 'unpaid' | 'paid';

export default function DebtsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('customers');
  const [filterPaid, setFilterPaid] = useState<FilterPaid>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<CustomerDebt | SupplierDebt | undefined>();
  const [paidAmount, setPaidAmount] = useState('');

  // Customer debt form
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formSupplierId, setFormSupplierId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formType, setFormType] = useState<DebtType>('MONEY');
  const [formDescription, setFormDescription] = useState('');
  const [formDueDate, setFormDueDate] = useState('');

  const isPaidFilter = filterPaid === 'all' ? undefined : filterPaid === 'paid';

  const customerDebtsQuery = useQuery({
    queryKey: ['debts', 'customers', { filterPaid }],
    queryFn: () => debtApi.customerDebts.list({ isPaid: isPaidFilter, pageSize: 50 }),
    enabled: tab === 'customers',
  });

  const supplierDebtsQuery = useQuery({
    queryKey: ['debts', 'suppliers', { filterPaid }],
    queryFn: () => debtApi.supplierDebts.list({ isPaid: isPaidFilter, pageSize: 50 }),
    enabled: tab === 'suppliers',
  });

  const summaryQuery = useQuery({
    queryKey: ['debts', 'summary'],
    queryFn: () => debtApi.summary(),
  });

  const customersQuery = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: () => customerApi.list({ pageSize: 200 }),
    enabled: createOpen && tab === 'customers',
  });

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', 'all'],
    queryFn: () => supplierApi.list({ pageSize: 200 }),
    enabled: createOpen && tab === 'suppliers',
  });

  const createCustomerDebtMutation = useMutation({
    mutationFn: () =>
      debtApi.customerDebts.create({
        customerId: formCustomerId,
        amount: Number(formAmount),
        type: formType,
        description: formDescription || undefined,
        dueDate: formDueDate || undefined,
      }),
    onSuccess: () => {
      toast.success('Đã thêm khoản nợ');
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      setCreateOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const createSupplierDebtMutation = useMutation({
    mutationFn: () =>
      debtApi.supplierDebts.create({
        supplierId: formSupplierId,
        amount: Number(formAmount),
        type: formType,
        description: formDescription || undefined,
        dueDate: formDueDate || undefined,
      }),
    onSuccess: () => {
      toast.success('Đã thêm khoản nợ');
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      setCreateOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const deleteCustomerDebtMutation = useMutation({
    mutationFn: (id: string) => debtApi.customerDebts.remove(id),
    onSuccess: () => {
      toast.success('Đã xoá');
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const deleteSupplierDebtMutation = useMutation({
    mutationFn: (id: string) => debtApi.supplierDebts.remove(id),
    onSuccess: () => {
      toast.success('Đã xoá');
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const payCustomerMutation = useMutation({
    mutationFn: (id: string) => debtApi.customerDebts.pay(id, Number(paidAmount)),
    onSuccess: () => {
      toast.success('Đã ghi nhận thanh toán');
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      setPayOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const paySupplierMutation = useMutation({
    mutationFn: (id: string) => debtApi.supplierDebts.pay(id, Number(paidAmount)),
    onSuccess: () => {
      toast.success('Đã ghi nhận thanh toán');
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      setPayOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  function openCreate() {
    setFormCustomerId('');
    setFormSupplierId('');
    setFormAmount('');
    setFormType('MONEY');
    setFormDescription('');
    setFormDueDate('');
    setCreateOpen(true);
  }

  function openPay(debt: CustomerDebt | SupplierDebt) {
    setPayTarget(debt);
    setPaidAmount('');
    setPayOpen(true);
  }

  function handleCreateSubmit() {
    if (tab === 'customers') createCustomerDebtMutation.mutate();
    else createSupplierDebtMutation.mutate();
  }

  function handlePaySubmit() {
    if (!payTarget) return;
    if (tab === 'customers') payCustomerMutation.mutate(payTarget.id);
    else paySupplierMutation.mutate(payTarget.id);
  }

  const isCreatePending = createCustomerDebtMutation.isPending || createSupplierDebtMutation.isPending;
  const isPayPending = payCustomerMutation.isPending || paySupplierMutation.isPending;
  const summary = summaryQuery.data;

  const items = tab === 'customers'
    ? (customerDebtsQuery.data?.items ?? [])
    : (supplierDebtsQuery.data?.items ?? []);

  const isLoading = tab === 'customers' ? customerDebtsQuery.isLoading : supplierDebtsQuery.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sổ nợ"
        description="Quản lý công nợ khách hàng và nhà cung cấp"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Thêm khoản nợ
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Khách hàng còn nợ</p>
              <p className="text-xl font-bold text-amber-700">
                {summaryQuery.isLoading ? '—' : formatCurrency(summary?.customerDebtTotal ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nợ nhà cung cấp</p>
              <p className="text-xl font-bold text-rose-700">
                {summaryQuery.isLoading ? '—' : formatCurrency(summary?.supplierDebtTotal ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border bg-muted/30 p-1 gap-1">
          <button
            onClick={() => setTab('customers')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${tab === 'customers' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          >
            Khách hàng
          </button>
          <button
            onClick={() => setTab('suppliers')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${tab === 'suppliers' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          >
            Nhà cung cấp
          </button>
        </div>
        <Select value={filterPaid} onValueChange={(v) => setFilterPaid(v as FilterPaid)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="unpaid">Chưa trả</SelectItem>
            <SelectItem value="paid">Đã trả</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="Chưa có khoản nợ" description="Bấm Thêm khoản nợ để bắt đầu" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead className="text-right">Đã trả</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Hạn TT</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-28 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((d) => {
                const name =
                  tab === 'customers'
                    ? (d as CustomerDebt).customer?.name
                    : (d as SupplierDebt).supplier?.name;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{name ?? '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${d.type === 'MONEY' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                        {d.type === 'MONEY' ? 'Tiền' : 'Hàng'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(d.amount)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(d.paidAmount)}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{d.description || '-'}</TableCell>
                    <TableCell>{d.dueDate ? formatDate(d.dueDate) : '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${d.isPaid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                        {d.isPaid ? 'Đã trả' : 'Còn nợ'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!d.isPaid && (
                          <Button variant="ghost" size="icon" title="Thanh toán" onClick={() => openPay(d)}>
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Xoá khoản nợ này?')) {
                              if (tab === 'customers') deleteCustomerDebtMutation.mutate(d.id);
                              else deleteSupplierDebtMutation.mutate(d.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm khoản nợ — {tab === 'customers' ? 'Khách hàng' : 'Nhà cung cấp'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {tab === 'customers' ? (
              <div className="space-y-2">
                <Label>Khách hàng *</Label>
                <Select value={formCustomerId} onValueChange={setFormCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khách hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    {customersQuery.data?.items.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} — {c.phone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Nhà cung cấp *</Label>
                <Select value={formSupplierId} onValueChange={setFormSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhà cung cấp" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliersQuery.data?.items.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Loại nợ</Label>
              <Select value={formType} onValueChange={(v) => setFormType(v as DebtType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONEY">Tiền mặt</SelectItem>
                  <SelectItem value="GOODS">Hàng hoá</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Số tiền (VND) *</Label>
              <Input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="100000" min={0} />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Ghi chú" />
            </div>
            <div className="space-y-2">
              <Label>Hạn thanh toán</Label>
              <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Huỷ</Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={isCreatePending || !formAmount || (tab === 'customers' ? !formCustomerId : !formSupplierId)}
            >
              {isCreatePending ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ghi nhận thanh toán</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tổng nợ: <span className="font-semibold text-foreground">{formatCurrency(payTarget?.amount ?? 0)}</span>
              {' · '}Đã trả: <span className="font-semibold text-foreground">{formatCurrency(payTarget?.paidAmount ?? 0)}</span>
            </p>
            <div className="space-y-2">
              <Label>Số tiền thanh toán *</Label>
              <Input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder={String((payTarget?.amount ?? 0) - (payTarget?.paidAmount ?? 0))}
                min={0}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayOpen(false)}>Huỷ</Button>
            <Button onClick={handlePaySubmit} disabled={isPayPending || !paidAmount}>
              {isPayPending ? 'Đang lưu…' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
