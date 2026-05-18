'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  CalendarClock,
  CheckCircle2,
  MapPin,
  Package,
  PhoneCall,
  Repeat,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { qrApi } from '@/services/api/order.api';
import { bookingApi } from '@/services/api/booking.api';
import { extractError } from '@/services/api/client';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { BookingPrefillItem, Order, PublicOrder } from '@/types/api';

export default function PublicOrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const orderQuery = useQuery({
    queryKey: ['qr', token],
    queryFn: () => qrApi.verify(token),
    retry: false,
  });

  const prefillQuery = useQuery({
    queryKey: ['qr', token, 'prefill'],
    queryFn: () => bookingApi.prefillFromQr(token),
    retry: false,
    enabled: !!orderQuery.data,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow">
            <Package className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Laundry QR</h1>
          <p className="text-sm text-muted-foreground">
            Tra cứu đơn & đặt lại dịch vụ giặt sấy
          </p>
        </div>

        {orderQuery.isLoading && (
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        )}

        {orderQuery.isError && (
          <Card className="border-rose-200">
            <CardHeader>
              <CardTitle className="text-rose-600">
                Không tìm thấy đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {extractError(orderQuery.error).message}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Mã QR có thể đã bị huỷ hoặc không hợp lệ.
              </p>
            </CardContent>
          </Card>
        )}

        {orderQuery.data && <OrderView order={orderQuery.data} />}

        {prefillQuery.data && (
          <RebookForm token={token} prefill={prefillQuery.data} />
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Trang công khai · không yêu cầu đăng nhập
        </div>
        <div className="text-center text-xs">
          <Link href="/login" className="text-primary underline">
            Bạn là nhân viên? Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}

function OrderView({ order }: { order: Order | PublicOrder }) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Mã đơn</p>
          <CardTitle className="font-mono text-2xl">{order.code}</CardTitle>
        </div>
        <OrderStatusBadge status={order.status} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Khách hàng</p>
            <p className="font-medium">{order.customer?.name ?? '-'}</p>
            <p className="text-xs text-muted-foreground">
              {order.customer?.phone}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tạo lúc</p>
            <p className="font-medium">{formatDateTime(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Hẹn lấy</p>
            <p className="font-medium">{formatDateTime(order.pickupAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Đã giao lúc</p>
            <p className="font-medium">{formatDateTime(order.deliveredAt)}</p>
          </div>
        </div>

        <Separator />

        <div>
          <p className="mb-2 text-sm font-medium">Sản phẩm</p>
          <div className="space-y-2">
            {order.items.map((it, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
              >
                <p>
                  {it.name}{' '}
                  <span className="text-muted-foreground">×{it.quantity}</span>
                  {it.weight ? (
                    <span className="text-muted-foreground"> · {it.weight}kg</span>
                  ) : null}
                </p>
                {'unitPrice' in it && it.unitPrice !== undefined ? (
                  <p className="font-medium">
                    {formatCurrency(
                      'subtotal' in it && it.subtotal
                        ? it.subtotal
                        : it.unitPrice * it.quantity,
                    )}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {'totalAmount' in order && order.totalAmount !== undefined && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Tổng cộng</p>
              <p className="text-xl font-bold">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </>
        )}

        {order.note && (
          <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <strong>Ghi chú:</strong> {order.note}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function toDatetimeLocal(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface RebookFormProps {
  token: string;
  prefill: {
    customer: { name: string; phone: string; address: string | null };
    sourceOrder: { code: string };
    items: BookingPrefillItem[];
  };
}

function RebookForm({ token, prefill }: RebookFormProps) {
  const [phone, setPhone] = useState(prefill.customer.phone ?? '');
  const [address, setAddress] = useState(prefill.customer.address ?? '');
  const [pickupAt, setPickupAt] = useState('');
  const [deliveryAt, setDeliveryAt] = useState('');
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(prefill.items.map((_, i) => [i, true])),
  );
  const [submitted, setSubmitted] = useState<string | null>(null);

  useEffect(() => {
    setPhone(prefill.customer.phone ?? '');
    setAddress(prefill.customer.address ?? '');
  }, [prefill.customer.phone, prefill.customer.address]);

  const chosenItems = useMemo(
    () => prefill.items.filter((_, idx) => selected[idx]),
    [prefill.items, selected],
  );

  const total = useMemo(
    () =>
      chosenItems.reduce((sum, i) => sum + i.quantity * (i.unitPrice ?? 0), 0),
    [chosenItems],
  );

  const mutation = useMutation({
    mutationFn: () =>
      bookingApi.createFromQr(token, {
        phone: phone.trim(),
        address: address.trim(),
        pickupAt: pickupAt ? new Date(pickupAt).toISOString() : undefined,
        deliveryAt: deliveryAt ? new Date(deliveryAt).toISOString() : undefined,
        note: note.trim() || undefined,
        items: chosenItems.map((i) => ({
          productId: i.productId ?? undefined,
          name: i.name,
          quantity: i.quantity,
          weight: i.weight ?? undefined,
          unitPrice: i.unitPrice,
        })),
      }),
    onSuccess: (booking) => {
      setSubmitted(booking.code);
      toast.success('Đặt lịch giặt thành công!');
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  if (submitted) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/30 shadow-lg">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-emerald-700">Đã gửi yêu cầu</CardTitle>
            <p className="text-xs text-muted-foreground">
              Mã đặt lịch: <span className="font-mono font-semibold">{submitted}</span>
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Chúng tôi đã ghi nhận yêu cầu giặt lại của bạn. Nhân viên sẽ liên hệ
            qua số <strong>{phone}</strong> để xác nhận thời gian lấy đồ. Cảm ơn
            bạn đã tin dùng dịch vụ!
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Lần sau quét QR, thông tin của bạn sẽ được tự động điền — chỉ cần
            chọn lại sản phẩm và bấm đặt.
          </p>
        </CardContent>
      </Card>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }
    if (!address.trim()) {
      toast.error('Vui lòng nhập địa chỉ');
      return;
    }
    if (chosenItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 sản phẩm cần giặt lại');
      return;
    }
    mutation.mutate();
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Repeat className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Đặt lại đơn này</CardTitle>
            <p className="text-xs text-muted-foreground">
              Từ đơn{' '}
              <span className="font-mono">{prefill.sourceOrder.code}</span> · Xin
              chào <strong>{prefill.customer.name}</strong>
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium">
              Chọn sản phẩm muốn giặt lại
            </p>
            <div className="space-y-2">
              {prefill.items.map((it, idx) => {
                const subtotal = it.quantity * (it.unitPrice ?? 0);
                return (
                  <label
                    key={idx}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-md border bg-card px-3 py-2 text-sm transition hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={!!selected[idx]}
                        onChange={(e) =>
                          setSelected((s) => ({
                            ...s,
                            [idx]: e.target.checked,
                          }))
                        }
                      />
                      <div>
                        <p className="font-medium">{it.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {it.quantity} ×{' '}
                          {formatCurrency(it.unitPrice ?? 0)}
                          {it.weight ? ` · ${it.weight}kg` : ''}
                        </p>
                      </div>
                    </div>
                    <p className="font-medium">{formatCurrency(subtotal)}</p>
                  </label>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                Tạm tính ({chosenItems.length} sản phẩm)
              </span>
              <span className="font-semibold">{formatCurrency(total)}</span>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <PhoneCall className="h-3.5 w-3.5" /> Số điện thoại liên hệ *
              </Label>
              <Input
                id="phone"
                inputMode="tel"
                placeholder="VD: 0901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address" className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Địa chỉ giao nhận *
              </Label>
              <Textarea
                id="address"
                rows={2}
                placeholder="Số nhà, đường, phường/xã, quận/huyện…"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pickupAt" className="flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" /> Thời gian lấy đồ
              </Label>
              <Input
                id="pickupAt"
                type="datetime-local"
                value={pickupAt}
                min={toDatetimeLocal(new Date())}
                onChange={(e) => setPickupAt(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deliveryAt" className="flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" /> Thời gian giao trả
              </Label>
              <Input
                id="deliveryAt"
                type="datetime-local"
                value={deliveryAt}
                min={pickupAt || toDatetimeLocal(new Date())}
                onChange={(e) => setDeliveryAt(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="note">Ghi chú thêm (tuỳ chọn)</Label>
              <Textarea
                id="note"
                rows={2}
                placeholder="VD: Có vết bẩn cần xử lý kỹ, không xài chất tẩy mạnh…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Đang gửi yêu cầu…' : 'Đặt giặt lại'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Bằng cách đặt lại, bạn đồng ý để tiệm liên hệ qua số điện thoại trên.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
