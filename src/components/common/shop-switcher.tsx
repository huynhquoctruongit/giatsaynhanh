'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Link2, Loader2, Store, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { authApi } from '@/services/api/auth.api';
import { extractError } from '@/services/api/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** Đổi tiệm cho ADMIN quản lý nhiều tiệm (không cần đăng xuất/đăng nhập lại). */
export function ShopSwitcher() {
  const { user, switchShop } = useAuth();
  const queryClient = useQueryClient();
  const [linkOpen, setLinkOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isAdmin = user?.role === 'ADMIN';
  const { data: shops = [] } = useQuery({
    queryKey: ['linked-shops', user?.id],
    queryFn: authApi.linkedShops,
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const linkMutation = useMutation({
    mutationFn: authApi.linkShop,
    onSuccess: (data) => {
      queryClient.setQueryData(['linked-shops', user?.id], data);
      toast.success('Đã liên kết tiệm');
      setLinkOpen(false);
      setEmail('');
      setPassword('');
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const unlinkMutation = useMutation({
    mutationFn: authApi.unlinkShop,
    onSuccess: (data) => {
      queryClient.setQueryData(['linked-shops', user?.id], data);
      toast.success('Đã huỷ liên kết');
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  if (!isAdmin) return null;

  const current = shops.find((s) => s.isCurrent);
  const currentName = current?.shopName ?? user?.shopName ?? 'Tiệm hiện tại';

  const handleSwitch = async (shopId: string) => {
    setSwitching(shopId);
    try {
      await switchShop(shopId);
    } catch (err) {
      toast.error(extractError(err).message);
      setSwitching(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-left transition hover:bg-accent">
            <Store className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted-foreground">Tiệm đang xem</p>
              <p className="truncate text-sm font-semibold">{currentName}</p>
            </div>
            {switching ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel>Chuyển tiệm</DropdownMenuLabel>
          {shops.map((s) => (
            <DropdownMenuItem
              key={s.shopId}
              disabled={!!switching}
              onSelect={(e) => {
                if (s.isCurrent) return;
                e.preventDefault();
                handleSwitch(s.shopId);
              }}
              className="group gap-2"
            >
              <Check className={cn('h-4 w-4', s.isCurrent ? 'opacity-100' : 'opacity-0')} />
              <span className="min-w-0 flex-1 truncate">{s.shopName}</span>
              {!s.isCurrent && (
                <span
                  role="button"
                  title="Huỷ liên kết"
                  className="rounded p-1 text-muted-foreground opacity-0 hover:text-rose-600 group-hover:opacity-100"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (confirm(`Huỷ liên kết với "${s.shopName}"?`)) unlinkMutation.mutate(s.shopId);
                  }}
                >
                  <Unlink className="h-3.5 w-3.5" />
                </span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setLinkOpen(true)} className="gap-2">
            <Link2 className="h-4 w-4" />
            Liên kết tiệm khác
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Liên kết tiệm khác</DialogTitle>
            <DialogDescription>
              Nhập tài khoản ADMIN của tiệm kia (chỉ cần 1 lần). Sau đó bạn đổi tiệm ngay trong menu,
              không cần đăng xuất.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              linkMutation.mutate({ email, password });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="link-email">Email</Label>
              <Input
                id="link-email"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="link-password">Mật khẩu</Label>
              <Input
                id="link-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setLinkOpen(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={linkMutation.isPending}>
                {linkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Liên kết
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
