'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Trash2, KeyRound, Shield } from 'lucide-react';
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
import { staffApi, type StaffMember } from '@/services/api/staff.api';
import { extractError } from '@/services/api/client';
import { useAuth } from '@/hooks/use-auth';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDate } from '@/lib/utils';

const PERMISSIONS = [
  { key: 'ORDER_CREATE', label: 'Tạo đơn hàng' },
  { key: 'ORDER_UPDATE', label: 'Cập nhật đơn hàng' },
  { key: 'ORDER_DELETE', label: 'Xoá đơn hàng' },
  { key: 'CUSTOMER_MANAGE', label: 'Quản lý khách hàng' },
  { key: 'PRODUCT_MANAGE', label: 'Quản lý sản phẩm' },
  { key: 'INVENTORY_MANAGE', label: 'Quản lý kho hàng' },
  { key: 'FINANCE_MANAGE', label: 'Quản lý thu chi' },
  { key: 'REPORT_VIEW', label: 'Xem báo cáo' },
];

export default function StaffPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | undefined>();
  const [permTarget, setPermTarget] = useState<StaffMember | undefined>();
  const [pwTarget, setPwTarget] = useState<StaffMember | undefined>();

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
  const [formIsActive, setFormIsActive] = useState(true);

  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [orderViewTimeLimit, setOrderViewTimeLimit] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');

  const query = useQuery({
    queryKey: ['staff', { search: debounced }],
    queryFn: () => staffApi.list({ search: debounced || undefined, pageSize: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      staffApi.create({
        email: formEmail,
        password: formPassword,
        name: formName,
        phone: formPhone || undefined,
        role: formRole,
      }),
    onSuccess: () => {
      toast.success('Đã thêm nhân viên');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setFormOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const updateMutation = useMutation({
    mutationFn: (id: string) =>
      staffApi.update(id, {
        name: formName,
        phone: formPhone || undefined,
        role: formRole,
        isActive: formIsActive,
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật nhân viên');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setFormOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => staffApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xoá nhân viên');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const permMutation = useMutation({
    mutationFn: (id: string) =>
      staffApi.updatePermissions(id, {
        permissions: selectedPerms,
        orderViewTimeLimit: orderViewTimeLimit ? Number(orderViewTimeLimit) : null,
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật quyền');
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setPermOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const pwMutation = useMutation({
    mutationFn: (id: string) => staffApi.resetPassword(id, newPassword),
    onSuccess: () => {
      toast.success('Đã đặt lại mật khẩu');
      setPwOpen(false);
      setNewPassword('');
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  function openCreate() {
    setEditing(undefined);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFormRole('STAFF');
    setFormIsActive(true);
    setFormOpen(true);
  }

  function openEdit(s: StaffMember) {
    setEditing(s);
    setFormName(s.name);
    setFormEmail(s.email);
    setFormPhone(s.phone ?? '');
    setFormPassword('');
    setFormRole(s.role);
    setFormIsActive(s.isActive);
    setFormOpen(true);
  }

  function openPermissions(s: StaffMember) {
    setPermTarget(s);
    setSelectedPerms(s.permissions ?? []);
    setOrderViewTimeLimit(s.orderViewTimeLimit?.toString() ?? '');
    setPermOpen(true);
  }

  function openResetPassword(s: StaffMember) {
    setPwTarget(s);
    setNewPassword('');
    setPwOpen(true);
  }

  function handleSubmitForm() {
    if (editing) {
      updateMutation.mutate(editing.id);
    } else {
      createMutation.mutate();
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhân viên"
        description="Quản lý tài khoản nhân viên và phân quyền"
        actions={
          isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Thêm nhân viên
            </Button>
          )
        }
      />

      <Card className="p-4">
        <div className="mb-4 flex gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Tìm tên, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : query.data?.items.length === 0 ? (
          <EmptyState title="Chưa có nhân viên" description="Bấm Thêm nhân viên để bắt đầu" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Tạo lúc</TableHead>
                {isAdmin && <TableHead className="w-32 text-right">Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data?.items.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.email}</TableCell>
                  <TableCell>{s.phone || '-'}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        s.role === 'ADMIN'
                          ? 'border-violet-200 bg-violet-50 text-violet-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      {s.role === 'ADMIN' ? 'Quản lý' : 'Nhân viên'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        s.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      {s.isActive ? 'Hoạt động' : 'Đã khoá'}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(s.createdAt)}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Sửa"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Phân quyền"
                          onClick={() => openPermissions(s)}
                        >
                          <Shield className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Đặt lại mật khẩu"
                          onClick={() => openResetPassword(s)}
                        >
                          <KeyRound className="h-4 w-4 text-amber-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Xoá"
                          onClick={() => {
                            if (confirm(`Xoá nhân viên ${s.name}?`)) {
                              deleteMutation.mutate(s.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Sửa nhân viên' : 'Thêm nhân viên'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nguyễn Văn A" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={!!editing}
              />
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="0901234567" />
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label>Mật khẩu *</Label>
                <Input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Mật khẩu"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Vai trò</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as 'ADMIN' | 'STAFF')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Nhân viên</SelectItem>
                  <SelectItem value="ADMIN">Quản lý</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editing && (
              <div className="flex items-center gap-3">
                <Label>Trạng thái</Label>
                <button
                  type="button"
                  onClick={() => setFormIsActive((v) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${formIsActive ? 'bg-primary' : 'bg-muted'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${formIsActive ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
                <span className="text-sm">{formIsActive ? 'Hoạt động' : 'Đã khoá'}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Huỷ</Button>
            <Button onClick={handleSubmitForm} disabled={isPending}>
              {isPending ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permOpen} onOpenChange={setPermOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Phân quyền — {permTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {PERMISSIONS.map((p) => {
              const checked = selectedPerms?.includes(p.key);
              return (
                <div key={p.key} className="flex items-center justify-between">
                  <Label>{p.label}</Label>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPerms((prev) =>
                        checked ? prev.filter((x) => x !== p.key) : [...prev, p.key],
                      )
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${checked ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              );
            })}
            <div className="space-y-2 border-t pt-3">
              <Label>Giới hạn xem đơn (phút, để trống = không giới hạn)</Label>
              <Input
                type="number"
                value={orderViewTimeLimit}
                onChange={(e) => setOrderViewTimeLimit(e.target.value)}
                placeholder="60"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPermOpen(false)}>Huỷ</Button>
            <Button
              onClick={() => permTarget && permMutation.mutate(permTarget.id)}
              disabled={permMutation.isPending}
            >
              {permMutation.isPending ? 'Đang lưu…' : 'Lưu quyền'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đặt lại mật khẩu — {pwTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Mật khẩu mới *</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mật khẩu mới"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPwOpen(false)}>Huỷ</Button>
            <Button
              onClick={() => pwTarget && pwMutation.mutate(pwTarget.id)}
              disabled={pwMutation.isPending || !newPassword}
            >
              {pwMutation.isPending ? 'Đang đặt lại…' : 'Đặt lại'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
