'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { supplierApi, type Supplier } from '@/services/api/supplier.api';
import { extractError } from '@/services/api/client';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDate } from '@/lib/utils';

export default function SuppliersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [filterActive, setFilterActive] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | undefined>();

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNote, setFormNote] = useState('');

  const query = useQuery({
    queryKey: ['suppliers', { search: debounced, filterActive }],
    queryFn: () =>
      supplierApi.list({
        search: debounced || undefined,
        isActive: filterActive === 'all' ? undefined : filterActive === 'active',
        pageSize: 50,
      }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      supplierApi.create({
        name: formName,
        phone: formPhone || undefined,
        email: formEmail || undefined,
        address: formAddress || undefined,
        note: formNote || undefined,
      }),
    onSuccess: () => {
      toast.success('Đã thêm nhà cung cấp');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) =>
      supplierApi.update(id, {
        name: formName,
        phone: formPhone || undefined,
        email: formEmail || undefined,
        address: formAddress || undefined,
        note: formNote || undefined,
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật nhà cung cấp');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => supplierApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xoá nhà cung cấp');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  function openCreate() {
    setEditing(undefined);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormNote('');
    setOpen(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setFormName(s.name);
    setFormPhone(s.phone ?? '');
    setFormEmail(s.email ?? '');
    setFormAddress(s.address ?? '');
    setFormNote(s.note ?? '');
    setOpen(true);
  }

  function handleSubmit() {
    if (editing) updateMutation.mutate(editing.id);
    else createMutation.mutate();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhà cung cấp"
        description="Quản lý danh sách nhà cung cấp hàng hoá và dịch vụ"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Thêm nhà cung cấp
          </Button>
        }
      />

      <Card className="p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Tìm tên, điện thoại…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterActive} onValueChange={setFilterActive}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Ngừng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : query.data?.items.length === 0 ? (
          <EmptyState title="Chưa có nhà cung cấp" description="Bấm Thêm nhà cung cấp để bắt đầu" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Tạo lúc</TableHead>
                <TableHead className="w-24 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data?.items.map((s) => (
                <TableRow key={s.id} className="cursor-pointer">
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.phone || '-'}</TableCell>
                  <TableCell>{s.email || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{s.address || '-'}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        s.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      {s.isActive ? 'Hoạt động' : 'Ngừng'}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(s.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Xoá nhà cung cấp "${s.name}"?`)) {
                            deleteMutation.mutate(s.id);
                          }
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
            <DialogTitle>{editing ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}</DialogTitle>
            <DialogDescription>Thông tin liên hệ nhà cung cấp</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Công ty TNHH ABC" />
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="0901234567" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="contact@abc.com" />
            </div>
            <div className="space-y-2">
              <Label>Địa chỉ</Label>
              <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="123 Đường ABC, TP.HCM" />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea rows={3} value={formNote} onChange={(e) => setFormNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
            <Button onClick={handleSubmit} disabled={isPending || !formName}>
              {isPending ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
