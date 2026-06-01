'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  MapPin,
  PackageOpen,
  Pencil,
  PhoneCall,
  Repeat,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/common/page-header';
import { BookingStatusBadge } from '@/components/common/booking-status-badge';
import { bookingApi } from '@/services/api/booking.api';
import { extractError } from '@/services/api/client';
import { useAuth } from '@/hooks/use-auth';
import { calcLineTotal, formatCurrency, formatDateTime } from '@/lib/utils';
import { BookingStatus } from '@/helpers/enums/booking-status';

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [editOpen, setEditOpen] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNote, setEditNote] = useState('');

  const query = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.detail(id),
  });

  const updateStatus = useMutation({
    mutationFn: (status: 'CONFIRMED' | 'CANCELLED') =>
      bookingApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái');
      qc.invalidateQueries({ queryKey: ['booking', id] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const convert = useMutation({
    mutationFn: () => bookingApi.convert(id),
    onSuccess: (booking) => {
      toast.success('Đã tạo đơn từ booking');
      qc.invalidateQueries({ queryKey: ['booking', id] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      if (booking.convertedOrder?.id) {
        router.push(`/orders/${booking.convertedOrder.id}`);
      }
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const updateBooking = useMutation({
    mutationFn: () =>
      bookingApi.update(id, {
        phone: editPhone,
        address: editAddress,
        note: editNote || null,
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật đặt lịch');
      qc.invalidateQueries({ queryKey: ['booking', id] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
      setEditOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const deleteBooking = useMutation({
    mutationFn: () => bookingApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xoá đặt lịch');
      qc.invalidateQueries({ queryKey: ['bookings'] });
      router.push('/bookings');
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  function openEdit() {
    const b = query.data;
    if (!b) return;
    setEditPhone(b.phone ?? '');
    setEditAddress(b.address ?? '');
    setEditNote(b.note ?? '');
    setEditOpen(true);
  }

  function handleDelete() {
    if (window.confirm(`Xoá đặt lịch ${query.data?.code ?? ''}?\nHành động này không thể hoàn tác.`)) {
      deleteBooking.mutate();
    }
  }

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Không tìm thấy đặt lịch
        </p>
        <Button variant="ghost" asChild className="mt-3">
          <Link href="/bookings">
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </Link>
        </Button>
      </div>
    );
  }

  const booking = query.data;
  const isPending = booking.status === BookingStatus.PENDING;
  const isConfirmed = booking.status === BookingStatus.CONFIRMED;
  const isFinal =
    booking.status === BookingStatus.CONVERTED ||
    booking.status === BookingStatus.CANCELLED;

  const total = booking.items.reduce(
    (sum, i) => sum + calcLineTotal(i),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={booking.code}
        description={`Gửi lúc ${formatDateTime(booking.createdAt)}`}
        actions={
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button variant="outline" onClick={openEdit}>
                  <Pencil className="h-4 w-4" /> Sửa
                </Button>
                <Button
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                  disabled={deleteBooking.isPending}
                >
                  <Trash2 className="h-4 w-4" /> Xoá
                </Button>
              </>
            )}
            <Button variant="ghost" asChild>
              <Link href="/bookings">
                <ArrowLeft className="h-4 w-4" /> Tất cả đặt lịch
              </Link>
            </Button>
          </div>
        }
      />

      {/* Dialog sửa đặt lịch */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sửa đặt lịch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Địa chỉ</Label>
              <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Huỷ</Button>
            <Button onClick={() => updateBooking.mutate()} disabled={updateBooking.isPending}>
              {updateBooking.isPending ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle>Thông tin yêu cầu</CardTitle>
                <BookingStatusBadge status={booking.status} />
              </div>
              {booking.sourceOrder && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/orders/${booking.sourceOrder.id}`}>
                    <Repeat className="h-3.5 w-3.5" /> Đơn gốc{' '}
                    {booking.sourceOrder.code}
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Khách hàng</p>
                <p className="font-medium">{booking.customer?.name ?? '-'}</p>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <PhoneCall className="h-3.5 w-3.5" /> {booking.phone}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Địa chỉ giao nhận</p>
                <p className="flex items-start gap-1 text-sm">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{booking.address}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Thời gian lấy đồ</p>
                <p className="flex items-center gap-1 text-sm font-medium">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {formatDateTime(booking.pickupAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Thời gian giao trả</p>
                <p className="flex items-center gap-1 text-sm font-medium">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {formatDateTime(booking.deliveryAt)}
                </p>
              </div>
              {booking.note && (
                <div className="md:col-span-2">
                  <p className="text-xs text-muted-foreground">Ghi chú</p>
                  <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {booking.note}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageOpen className="h-4 w-4" /> Sản phẩm khách muốn giặt lại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {booking.items.map((it) => (
                  <div
                    key={it.id ?? it.name}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{it.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.quantity} × {formatCurrency(it.unitPrice)}
                        {it.weight ? ` · ${it.weight}kg` : ''}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(it.subtotal ?? calcLineTotal(it))}
                    </p>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Tạm tính</p>
                <p className="text-xl font-bold">{formatCurrency(total)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hành động</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isFinal ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {booking.status === BookingStatus.CONVERTED
                      ? 'Đã chuyển thành đơn giặt sấy.'
                      : 'Yêu cầu này đã bị huỷ.'}
                  </p>
                  {booking.convertedOrder && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/orders/${booking.convertedOrder.id}`}>
                        Xem đơn {booking.convertedOrder.code}
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <Button
                    className="w-full"
                    onClick={() => convert.mutate()}
                    disabled={convert.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Tạo đơn từ đặt lịch
                  </Button>
                  {isPending && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => updateStatus.mutate('CONFIRMED')}
                      disabled={updateStatus.isPending}
                    >
                      Đánh dấu đã duyệt
                    </Button>
                  )}
                  {(isPending || isConfirmed) && (
                    <Button
                      variant="outline"
                      className="w-full text-rose-600 hover:bg-rose-50"
                      onClick={() => updateStatus.mutate('CANCELLED')}
                      disabled={updateStatus.isPending}
                    >
                      <XCircle className="h-4 w-4" /> Từ chối yêu cầu
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {booking.customer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Khách hàng lưu trên hệ thống</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">{booking.customer.name}</p>
                <p className="text-muted-foreground">
                  SĐT: {booking.customer.phone}
                </p>
                {booking.customer.address && (
                  <p className="text-muted-foreground">
                    Địa chỉ: {booking.customer.address}
                  </p>
                )}
                <p className="pt-2 text-xs text-muted-foreground">
                  Thông tin SĐT & địa chỉ khách điền lúc đặt đã được tự động
                  cập nhật vào hồ sơ.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
