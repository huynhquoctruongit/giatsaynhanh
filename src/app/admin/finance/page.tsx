'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
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
import { financeApi, type Transaction, type TransactionType } from '@/services/api/finance.api';
import { extractError } from '@/services/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';

const INCOME_CATEGORIES = ['Thu tiền đơn hàng', 'Thu khác'];
const EXPENSE_CATEGORIES = [
  'Tiền điện',
  'Tiền nước',
  'Tiền mặt bằng',
  'Tiền máy móc',
  'Tiền nhân công',
  'Chi khác',
];

export default function FinancePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TransactionType>('INCOME');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | undefined>();

  const [formType, setFormType] = useState<TransactionType>('INCOME');
  const [formCategory, setFormCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState('');

  const listQuery = useQuery({
    queryKey: ['finance', { type: activeTab, from, to }],
    queryFn: () =>
      financeApi.list({
        type: activeTab,
        from: from || undefined,
        to: to || undefined,
        pageSize: 50,
      }),
  });

  const summaryQuery = useQuery({
    queryKey: ['finance', 'summary', { from, to }],
    queryFn: () => financeApi.summary({ from: from || undefined, to: to || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      financeApi.create({
        type: formType,
        category: formCategory,
        amount: Number(formAmount),
        description: formDescription || undefined,
        date: formDate || undefined,
      }),
    onSuccess: () => {
      toast.success('Đã thêm giao dịch');
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      setOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) =>
      financeApi.update(id, {
        category: formCategory,
        amount: Number(formAmount),
        description: formDescription || undefined,
        date: formDate || undefined,
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật giao dịch');
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      setOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financeApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xoá giao dịch');
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  function openCreate() {
    setEditing(undefined);
    setFormType(activeTab);
    setFormCategory('');
    setFormAmount('');
    setFormDescription('');
    setFormDate('');
    setOpen(true);
  }

  function openEdit(t: Transaction) {
    setEditing(t);
    setFormType(t.type);
    setFormCategory(t.category);
    setFormAmount(t.amount.toString());
    setFormDescription(t.description ?? '');
    setFormDate(t.date ? t.date.split('T')[0] : '');
    setOpen(true);
  }

  function handleSubmit() {
    if (editing) updateMutation.mutate(editing.id);
    else createMutation.mutate();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;
  const summary = summaryQuery.data;

  const categoryOptions = formType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thu chi"
        description="Quản lý thu chi tài chính của cửa hàng"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Thêm giao dịch
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng thu</p>
              <p className="text-xl font-bold text-emerald-700">
                {summaryQuery.isLoading ? '—' : formatCurrency(summary?.totalIncome ?? 0)}
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
              <p className="text-sm text-muted-foreground">Tổng chi</p>
              <p className="text-xl font-bold text-rose-700">
                {summaryQuery.isLoading ? '—' : formatCurrency(summary?.totalExpense ?? 0)}
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
              <p className="text-sm text-muted-foreground">Số dư</p>
              <p className={`text-xl font-bold ${(summary?.balance ?? 0) >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                {summaryQuery.isLoading ? '—' : formatCurrency(summary?.balance ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border bg-muted/30 p-1 gap-1">
          <button
            onClick={() => setActiveTab('INCOME')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${activeTab === 'INCOME' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          >
            Thu
          </button>
          <button
            onClick={() => setActiveTab('EXPENSE')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${activeTab === 'EXPENSE' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          >
            Chi
          </button>
        </div>
        <Input
          type="date"
          className="w-40"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="Từ ngày"
        />
        <Input
          type="date"
          className="w-40"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Đến ngày"
        />
        {(from || to) && (
          <Button variant="ghost" size="sm" onClick={() => { setFrom(''); setTo(''); }}>
            Xoá bộ lọc
          </Button>
        )}
      </div>

      <Card className="p-4">
        {listQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : listQuery.data?.items.length === 0 ? (
          <EmptyState
            title={`Chưa có giao dịch ${activeTab === 'INCOME' ? 'thu' : 'chi'}`}
            description="Bấm Thêm giao dịch để bắt đầu"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="w-24 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.data?.items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{formatDate(t.date || t.createdAt)}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {t.category}
                    </span>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${t.type === 'INCOME' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {t.description || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Xoá giao dịch này?')) deleteMutation.mutate(t.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Sửa giao dịch' : 'Thêm giao dịch'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div className="space-y-2">
                <Label>Loại</Label>
                <Select value={formType} onValueChange={(v) => { setFormType(v as TransactionType); setFormCategory(''); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Thu</SelectItem>
                    <SelectItem value="EXPENSE">Chi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Danh mục *</Label>
              <Input
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Nhập hoặc chọn danh mục"
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {categoryOptions.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label>Số tiền (VND) *</Label>
              <Input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="50000"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Ghi chú thêm"
              />
            </div>
            <div className="space-y-2">
              <Label>Ngày</Label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !formCategory || !formAmount}
            >
              {isPending ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
