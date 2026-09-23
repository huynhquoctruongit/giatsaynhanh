'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ScanBarcode, User as UserIcon, ExternalLink, CheckCircle2, ArrowRightCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { orderApi } from '@/services/api/order.api';
import { extractError } from '@/services/api/client';
import { NEXT_STATUS_TRANSITIONS, ORDER_STATUS_LABEL, type OrderStatus } from '@/helpers/enums/order-status';
import { formatCurrency } from '@/lib/utils';
import type { Order } from '@/types/api';

interface Props {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

export function OrderScanDialog({ order, open, onClose }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => orderApi.updateStatus(order!.id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', order!.id] });
      queryClient.invalidateQueries({ queryKey: ['report'] });
      toast.success(`✓ ${ORDER_STATUS_LABEL[updated.status]}`, { description: updated.code });
      onClose();
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  if (!order) return null;

  const nextStatuses = NEXT_STATUS_TRANSITIONS[order.status] ?? [];
  const discount = Number(order.discountAmount ?? 0);
  const remaining = Number(order.totalAmount ?? 0) - discount;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="h-5 w-5 text-primary" />
            <span className="font-mono">{order.code}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <OrderStatusBadge status={order.status} />

          <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3">
            <UserIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-semibold">{order.customer?.name ?? '—'}</p>
              {order.customer?.phone && (
                <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
              )}
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Số mặt hàng</span>
              <span className="font-medium">{order.items.length} món</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tổng tiền</span>
              <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Giảm giá</span>
                <span className="font-medium">{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between rounded-md bg-primary/10 p-3 font-semibold text-primary">
              <span>Còn phải thu</span>
              <span>{formatCurrency(remaining)}</span>
            </div>
          </div>

          <div className="space-y-2">
            {nextStatuses
              .filter((s) => s !== 'CANCELLED')
              .map((s) => (
                <Button
                  key={s}
                  className="w-full"
                  size="lg"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate(s)}
                >
                  {s === 'DELIVERED' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <ArrowRightCircle className="h-4 w-4" />
                  )}
                  {ORDER_STATUS_LABEL[s]}
                </Button>
              ))}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => { onClose(); router.push(`/admin/orders/${order.id}`); }}
            >
              <ExternalLink className="h-4 w-4" />
              Mở chi tiết đơn
            </Button>

            {nextStatuses.includes('CANCELLED') && (
              <Button
                variant="destructive"
                className="w-full"
                disabled={statusMutation.isPending}
                onClick={() => statusMutation.mutate('CANCELLED')}
              >
                Huỷ đơn
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
