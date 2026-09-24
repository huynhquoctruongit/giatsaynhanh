'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, UserPlus, Link2, Copy, RefreshCw } from 'lucide-react';
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
import { platformApi, PLATFORM_API_BASE_URL, type Shop } from '@/services/api/platform.api';
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

  const [webhookFormOpen, setWebhookFormOpen] = useState(false);
  const [webhookTarget, setWebhookTarget] = useState<Shop | undefined>();
  const [webhookSecretInput, setWebhookSecretInput] = useState('');

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

  const rotateTokenMutation = useMutation({
    mutationFn: (shopId: string) => platformApi.rotateWebhookToken(shopId),
    onSuccess: (result) => {
      toast.success('Đã tạo link webhook mới');
      queryClient.invalidateQueries({ queryKey: ['platform-shops'] });
      setWebhookTarget((prev) => (prev ? { ...prev, webhookToken: result.webhookToken } : prev));
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const setSecretMutation = useMutation({
    mutationFn: (shopId: string) => platformApi.setWebhookSecret(shopId, webhookSecretInput),
    onSuccess: () => {
      toast.success('Đã lưu secret webhook');
      queryClient.invalidateQueries({ queryKey: ['platform-shops'] });
      setWebhookSecretInput('');
      setWebhookTarget((prev) => (prev ? { ...prev, hasWebhookSecret: true } : prev));
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  function openWebhook(shop: Shop) {
    setWebhookTarget(shop);
    setWebhookSecretInput('');
    setWebhookFormOpen(true);
  }

  function copyWebhookUrl(token: string) {
    const url = `${PLATFORM_API_BASE_URL}/webhooks/gpmpay/${token}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Đã copy link webhook'));
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
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Webhook GPM Pay"
                      onClick={() => openWebhook(shop)}
                    >
                      <Link2 className="h-4 w-4 text-emerald-600" />
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

      {/* Webhook GPM Pay Dialog */}
      <Dialog open={webhookFormOpen} onOpenChange={setWebhookFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webhook GPM Pay — {webhookTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Link webhook</Label>
              {webhookTarget?.webhookToken ? (
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${PLATFORM_API_BASE_URL}/webhooks/gpmpay/${webhookTarget.webhookToken}`}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    title="Copy link"
                    onClick={() => copyWebhookUrl(webhookTarget.webhookToken as string)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tiệm này chưa có link webhook.</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (
                    webhookTarget?.webhookToken &&
                    !window.confirm(
                      'Tạo lại token sẽ làm link webhook cũ ngừng nhận ngay lập tức. Tiếp tục?',
                    )
                  ) {
                    return;
                  }
                  webhookTarget && rotateTokenMutation.mutate(webhookTarget.id);
                }}
                disabled={rotateTokenMutation.isPending}
              >
                <RefreshCw className="h-4 w-4" />
                {webhookTarget?.webhookToken ? 'Tạo lại token' : 'Tạo link webhook'}
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Secret (GPM Pay cấp cho tiệm này)</Label>
              <Input
                type="password"
                value={webhookSecretInput}
                onChange={(e) => setWebhookSecretInput(e.target.value)}
                placeholder="Dán secret từ dashboard GPM Pay của tiệm"
              />
              <p className="text-xs text-muted-foreground">
                {webhookTarget?.hasWebhookSecret ? 'Đã cấu hình secret' : 'Chưa có secret'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setWebhookFormOpen(false)}>
              Đóng
            </Button>
            <Button
              onClick={() => webhookTarget && setSecretMutation.mutate(webhookTarget.id)}
              disabled={setSecretMutation.isPending || !webhookSecretInput}
            >
              {setSecretMutation.isPending ? 'Đang lưu…' : 'Lưu secret'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
