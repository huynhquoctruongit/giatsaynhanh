'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, UserPlus } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { platformApi, type Shop } from '@/services/api/platform.api';
import { extractError } from '@/services/api/client';
import { formatDate } from '@/lib/utils';

export default function PlatformShopsPage() {
  const queryClient = useQueryClient();

  const [shopFormOpen, setShopFormOpen] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopSlug, setShopSlug] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopAddress, setShopAddress] = useState('');

  const [adminFormOpen, setAdminFormOpen] = useState(false);
  const [adminTarget, setAdminTarget] = useState<Shop | undefined>();
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const query = useQuery({
    queryKey: ['platform-shops'],
    queryFn: () => platformApi.listShops(),
  });

  const createShopMutation = useMutation({
    mutationFn: () =>
      platformApi.createShop({
        name: shopName,
        slug: shopSlug,
        phone: shopPhone || undefined,
        address: shopAddress || undefined,
      }),
    onSuccess: () => {
      toast.success('Đã thêm tiệm');
      queryClient.invalidateQueries({ queryKey: ['platform-shops'] });
      setShopFormOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const createAdminMutation = useMutation({
    mutationFn: (shopId: string) =>
      platformApi.createShopAdmin(shopId, {
        name: adminName,
        email: adminEmail,
        password: adminPassword,
      }),
    onSuccess: () => {
      toast.success('Đã thêm tài khoản admin');
      queryClient.invalidateQueries({ queryKey: ['platform-shops'] });
      setAdminFormOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  function openCreateShop() {
    setShopName('');
    setShopSlug('');
    setShopPhone('');
    setShopAddress('');
    setShopFormOpen(true);
  }

  function openCreateAdmin(shop: Shop) {
    setAdminTarget(shop);
    setAdminName('');
    setAdminEmail('');
    setAdminPassword('');
    setAdminFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý tiệm"
        description="Danh sách toàn bộ tiệm trên hệ thống"
        actions={
          <Button onClick={openCreateShop}>
            <Plus className="h-4 w-4" /> Thêm tiệm
          </Button>
        }
      />

      <Card className="p-4">
        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : query.data?.length === 0 ? (
          <EmptyState title="Chưa có tiệm nào" description="Bấm Thêm tiệm để bắt đầu" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên tiệm</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Số tài khoản</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Tạo lúc</TableHead>
                <TableHead className="w-16 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data?.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell className="font-medium">{shop.name}</TableCell>
                  <TableCell className="text-muted-foreground">{shop.slug}</TableCell>
                  <TableCell>{shop.phone || '-'}</TableCell>
                  <TableCell>{shop._count.users}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        shop.isActive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      {shop.isActive ? 'Hoạt động' : 'Đã khoá'}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(shop.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Thêm tài khoản admin"
                      onClick={() => openCreateAdmin(shop)}
                    >
                      <UserPlus className="h-4 w-4 text-blue-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create Shop Dialog */}
      <Dialog open={shopFormOpen} onOpenChange={setShopFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm tiệm</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên tiệm *</Label>
              <Input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Giặt Sấy ABC"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input
                value={shopSlug}
                onChange={(e) => setShopSlug(e.target.value)}
                placeholder="giat-say-abc"
              />
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                placeholder="0901234567"
              />
            </div>
            <div className="space-y-2">
              <Label>Địa chỉ</Label>
              <Input
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="123 Đường ABC, Quận 1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShopFormOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={() => createShopMutation.mutate()}
              disabled={createShopMutation.isPending || !shopName || !shopSlug}
            >
              {createShopMutation.isPending ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Shop Admin Dialog */}
      <Dialog open={adminFormOpen} onOpenChange={setAdminFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm tài khoản admin — {adminTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên *</Label>
              <Input
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Mật khẩu *</Label>
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Mật khẩu"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdminFormOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={() => adminTarget && createAdminMutation.mutate(adminTarget.id)}
              disabled={
                createAdminMutation.isPending || !adminName || !adminEmail || !adminPassword
              }
            >
              {createAdminMutation.isPending ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
