'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  MapPin,
  Moon,
  Package,
  PhoneCall,
  Repeat,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { bookingApi } from '@/services/api/booking.api';
import { extractError } from '@/services/api/client';
import { cn, formatCurrency, formatDateTime } from '@/lib/utils';
import type { OrderStatus } from '@/helpers/enums/order-status';
import type {
  BookingPrefill,
  BookingPrefillActiveOrder,
  BookingPrefillService,
} from '@/types/api';

// ─────────────────────────────────────────────────────────────────────────────
// Public-facing status mapping: gom CREATED/RECEIVED/WASHING → "Đang giặt"

function publicStatusLabel(status: OrderStatus): string {
  if (status === 'DELIVERED') return 'Đã giao';
  if (status === 'READY') return 'Đã giặt';
  if (status === 'CANCELLED') return 'Đã huỷ';
  return 'Đang giặt';
}

function publicStatusClasses(status: OrderStatus): string {
  if (status === 'DELIVERED')
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'READY')
    return 'bg-violet-50 text-violet-700 border-violet-200';
  if (status === 'CANCELLED')
    return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function PublicStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        publicStatusClasses(status),
      )}
    >
      {publicStatusLabel(status)}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delivery time slots

interface TimeSlot {
  id: 'tonight' | 'morning';
  iso: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
  disabled: boolean;
}

function computeDeliverySlots(now: Date = new Date()): TimeSlot[] {
  const tonight = new Date(now);
  tonight.setHours(20, 0, 0, 0);

  const morning = new Date(now);
  morning.setDate(morning.getDate() + 1);
  morning.setHours(7, 0, 0, 0);

  const tonightPassed = tonight.getTime() <= now.getTime();

  // Nếu tối nay đã qua → dời sang tối mai
  const shiftedTonight = tonightPassed
    ? new Date(tonight.getFullYear(), tonight.getMonth(), tonight.getDate() + 1, 20, 0, 0)
    : tonight;

  return [
    {
      id: 'tonight',
      iso: shiftedTonight.toISOString(),
      label: '8h tối',
      sub: tonightPassed ? 'Ngày mai' : 'Hôm nay',
      icon: <Moon className="h-4 w-4" />,
      disabled: false,
    },
    {
      id: 'morning',
      iso: morning.toISOString(),
      label: '7h sáng',
      sub: 'Ngày mai',
      icon: <Sun className="h-4 w-4" />,
      disabled: false,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PublicOrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const prefillQuery = useQuery({
    queryKey: ['qr', token, 'prefill'],
    queryFn: () => bookingApi.prefillFromQr(token),
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-5">
      <div className="mx-auto max-w-xl space-y-4">
        {/* Header — gọn */}
        <div className="flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-400">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
            <Package className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold uppercase leading-tight tracking-wide">
              Giặt Sấy Nhanh
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {prefillQuery.data?.customer.name
                ? `Xin chào, ${prefillQuery.data.customer.name}`
                : 'Dịch vụ giao nhận đồ tại nhà'}
            </p>
          </div>
        </div>

        {prefillQuery.isLoading && (
          <Card>
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        )}

        {prefillQuery.isError && (
          <Card className="animate-in border-rose-200 fade-in zoom-in-95 duration-300">
            <CardContent className="p-4">
              <p className="font-medium text-rose-600">Không mở được trang</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {extractError(prefillQuery.error).message}
              </p>
            </CardContent>
          </Card>
        )}

        {prefillQuery.data && (
          <PublicBookingFlow token={token} prefill={prefillQuery.data} />
        )}

        <div className="flex items-center justify-center gap-1.5 pt-1 text-xs text-muted-foreground">
          <ShieldCheck className="h-3 w-3" />
          <span>Không yêu cầu đăng nhập</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

type View = 'simple' | 'custom';

function PublicBookingFlow({
  token,
  prefill,
}: {
  token: string;
  prefill: BookingPrefill;
}) {
  const activeOrders = prefill.activeOrders ?? [];
  const services = prefill.services ?? [];
  const sourceItems = prefill.items ?? [];
  const safePrefill: BookingPrefill = {
    ...prefill,
    activeOrders,
    services,
    items: sourceItems,
  };

  const hasPhone = !!prefill.customer.phone?.trim();
  const hasAddress = !!prefill.customer.address?.trim();
  const canQuickRebook = hasPhone && hasAddress && sourceItems.length > 0;

  const slots = useMemo(() => computeDeliverySlots(), []);
  const [deliveryAt, setDeliveryAt] = useState<string>(slots[1].iso); // mặc định: 7h sáng mai
  const [view, setView] = useState<View>(canQuickRebook ? 'simple' : 'custom');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const customRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view === 'custom') {
      requestAnimationFrame(() =>
        customRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    }
  }, [view]);

  useEffect(() => {
    if (submitted) {
      requestAnimationFrame(() =>
        successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      );
    }
  }, [submitted]);

  if (submitted) {
    return (
      <div ref={successRef}>
        <SuccessCard />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Booking form — nổi bật, lên trước */}
      {view === 'simple' && canQuickRebook && (
        <SimpleRebookView
          prefill={safePrefill}
          slots={slots}
          deliveryAt={deliveryAt}
          setDeliveryAt={setDeliveryAt}
          onConfirm={() => setConfirmOpen(true)}
          onCustom={() => setView('custom')}
        />
      )}

      {view === 'custom' && (
        <div ref={customRef}>
          <CustomBookingForm
            token={token}
            prefill={safePrefill}
            slots={slots}
            deliveryAt={deliveryAt}
            setDeliveryAt={setDeliveryAt}
            onSubmitted={setSubmitted}
            canGoBack={canQuickRebook}
            onGoBack={() => setView('simple')}
          />
        </div>
      )}

      {/* Trạng thái đơn — xuống cuối */}
      {activeOrders.length > 0 && (
        <ActiveOrdersCard orders={activeOrders} />
      )}

      <RebookConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        token={token}
        prefill={safePrefill}
        deliveryAt={deliveryAt}
        slots={slots}
        onSubmitted={(code) => {
          setConfirmOpen(false);
          setSubmitted(code);
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function joinItems(items: { name: string }[]): string {
  return items
    .map((i) => i.name)
    .filter(Boolean)
    .join(', ');
}

function findSlot(slots: TimeSlot[], iso: string): TimeSlot | undefined {
  return slots.find((s) => s.iso === iso);
}

function formatSlotText(slot: TimeSlot | undefined): string {
  if (!slot) return '—';
  return `${slot.sub} · ${slot.label}`;
}

// ─────────────────────────────────────────────────────────────────────────────

function ActiveOrdersCard({ orders }: { orders: BookingPrefillActiveOrder[] }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-400 space-y-1.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        Đơn đang xử lý
      </p>
      {orders.map((o) => (
        <div
          key={o.id}
          className="flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2.5 shadow-sm"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-snug">
              {joinItems(o.items) || '—'}
            </p>
            <p className="text-[11px] text-muted-foreground">{formatDateTime(o.createdAt)}</p>
          </div>
          <PublicStatusBadge status={o.status} />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function DeliverySlotPicker({
  slots,
  value,
  onChange,
}: {
  slots: TimeSlot[];
  value: string;
  onChange: (iso: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-sm font-semibold">
        <Clock className="h-3.5 w-3.5" />
        Bạn muốn tôi giao đồ lúc nào?
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {slots.map((s) => {
          const selected = value === s.iso;
          return (
            <button
              key={s.id}
              type="button"
              disabled={s.disabled}
              onClick={() => onChange(s.iso)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 text-center transition-all duration-200 active:scale-[0.97]',
                selected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/40 hover:bg-muted/30',
                s.disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                  selected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {s.icon}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {s.sub}
              </div>
              <div
                className={cn(
                  'text-base font-bold leading-tight',
                  selected && 'text-primary',
                )}
              >
                {s.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function SimpleRebookView({
  prefill,
  slots,
  deliveryAt,
  setDeliveryAt,
  onConfirm,
  onCustom,
}: {
  prefill: BookingPrefill;
  slots: TimeSlot[];
  deliveryAt: string;
  setDeliveryAt: (iso: string) => void;
  onConfirm: () => void;
  onCustom: () => void;
}) {
  return (
    <Card className="animate-in border-primary/20 shadow-lg fade-in slide-in-from-bottom-4 duration-500">
      <CardContent className="space-y-5 p-5">
        <div className="space-y-3 rounded-xl bg-muted/40 p-4">
          <InfoLine icon={<MapPin className="h-4 w-4" />} text={prefill.customer.address ?? '—'} />
          <InfoLine icon={<PhoneCall className="h-4 w-4" />} text={prefill.customer.phone} />
          <div className="border-t pt-3">
            <InfoLine
              icon={<Package className="h-4 w-4" />}
              text={joinItems(prefill.items) || 'Chưa có dịch vụ'}
            />
          </div>
        </div>

        <DeliverySlotPicker
          slots={slots}
          value={deliveryAt}
          onChange={setDeliveryAt}
        />

        {/* CTA chính — siêu nổi bật */}
        <button
          onClick={onConfirm}
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-primary to-blue-500 p-5 text-left text-white shadow-xl shadow-primary/40 ring-4 ring-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary/50 active:scale-[0.98] active:translate-y-0 focus:outline-none focus:ring-primary/40 animate-glow"
        >
          {/* Shimmer */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

          <div className="relative flex items-center justify-between gap-3">
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] opacity-95">
                <Sparkles className="h-3.5 w-3.5" />
                Chạm để đặt
              </div>
              <p className="text-2xl font-extrabold leading-tight">
                Đặt lại y như đơn cũ
              </p>
              <p className="mt-1 text-xs opacity-90">
                Giao đến địa chỉ cũ · {formatSlotText(findSlot(slots, deliveryAt))}
              </p>
            </div>
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-lg">
              <ChevronRight className="h-7 w-7 animate-nudge" strokeWidth={3} />
            </div>
          </div>
        </button>

        <button
          onClick={onCustom}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/30 hover:text-foreground"
        >
          <Edit3 className="h-4 w-4" />
          Thay đổi thông tin
        </button>
      </CardContent>
    </Card>
  );
}

function InfoLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <p className="min-w-0 flex-1 break-words font-medium leading-snug">{text}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function RebookConfirmDialog({
  open,
  onOpenChange,
  token,
  prefill,
  deliveryAt,
  slots,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  prefill: BookingPrefill;
  deliveryAt: string;
  slots: TimeSlot[];
  onSubmitted: (code: string) => void;
}) {
  const mutation = useMutation({
    mutationFn: () =>
      bookingApi.createFromQr(token, {
        phone: prefill.customer.phone.trim(),
        address: (prefill.customer.address ?? '').trim(),
        deliveryAt,
        items: prefill.items.map((i) => ({
          productId: i.productId ?? undefined,
          name: i.name,
          quantity: i.quantity,
          weight: i.weight ?? undefined,
          unitPrice: i.unitPrice,
        })),
      }),
    onSuccess: (booking) => {
      toast.success('Đặt giặt thành công!');
      onSubmitted(booking.code);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const slot = findSlot(slots, deliveryAt);

  return (
    <Dialog
      open={open}
      onOpenChange={mutation.isPending ? undefined : onOpenChange}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            Xác nhận đặt lại đơn
          </DialogTitle>
          <DialogDescription>
            Tiệm sẽ liên hệ qua số điện thoại của bạn để xác nhận.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg bg-muted/40 p-4 text-sm">
          <InfoLine icon={<MapPin className="h-4 w-4" />} text={prefill.customer.address ?? '—'} />
          <InfoLine icon={<PhoneCall className="h-4 w-4" />} text={prefill.customer.phone} />
          <div className="border-t pt-3">
            <InfoLine
              icon={<Package className="h-4 w-4" />}
              text={joinItems(prefill.items) || '—'}
            />
          </div>
          <div className="border-t pt-3">
            <InfoLine
              icon={<Clock className="h-4 w-4" />}
              text={`Lấy đồ: ${formatSlotText(slot)}`}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
            className="flex-1"
          >
            Huỷ
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 font-semibold"
          >
            {mutation.isPending ? 'Đang đặt…' : 'Xác nhận đặt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function CustomBookingForm({
  token,
  prefill,
  slots,
  deliveryAt,
  setDeliveryAt,
  onSubmitted,
  canGoBack,
  onGoBack,
}: {
  token: string;
  prefill: BookingPrefill;
  slots: TimeSlot[];
  deliveryAt: string;
  setDeliveryAt: (iso: string) => void;
  onSubmitted: (code: string) => void;
  canGoBack: boolean;
  onGoBack: () => void;
}) {
  const [phone, setPhone] = useState(prefill.customer.phone ?? '');
  const [address, setAddress] = useState(prefill.customer.address ?? '');
  const [note, setNote] = useState('');

  const initialSelection = useMemo(() => {
    const set = new Set<string>();
    for (const it of prefill.items) {
      if (it.productId) set.add(it.productId);
    }
    return set;
  }, [prefill.items]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(initialSelection);

  const contactRef = useRef<HTMLDivElement>(null);

  const justSelectedFirst = useRef(false);
  function toggleService(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (prev.size === 0 && next.size === 1) {
        justSelectedFirst.current = true;
      }
      return next;
    });
  }

  useEffect(() => {
    if (justSelectedFirst.current && selectedIds.size > 0) {
      justSelectedFirst.current = false;
      requestAnimationFrame(() =>
        contactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      );
    }
  }, [selectedIds]);

  const selectedItems = useMemo(
    () =>
      prefill.services
        .filter((s) => selectedIds.has(s.id))
        .map((s) => ({
          productId: s.id,
          name: s.name,
          quantity: 1,
          unitPrice: s.price,
        })),
    [prefill.services, selectedIds],
  );

  const mutation = useMutation({
    mutationFn: () =>
      bookingApi.createFromQr(token, {
        phone: phone.trim(),
        address: address.trim(),
        deliveryAt,
        note: note.trim() || undefined,
        items: selectedItems,
      }),
    onSuccess: (booking) => {
      toast.success('Đặt giặt thành công!');
      onSubmitted(booking.code);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất 1 dịch vụ');
      return;
    }
    if (!phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      contactRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (!address.trim()) {
      toast.error('Vui lòng nhập địa chỉ');
      contactRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    mutation.mutate();
  }

  return (
    <Card className="animate-in border-primary/20 shadow-lg fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Thay đổi thông tin</CardTitle>
          {canGoBack && (
            <button
              type="button"
              onClick={onGoBack}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Quay lại
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm font-semibold">
              <Package className="h-3.5 w-3.5" />
              Chọn dịch vụ bạn cần
            </Label>
            {prefill.services.length === 0 ? (
              <p className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Tiệm chưa cấu hình dịch vụ. Vui lòng liên hệ tiệm.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {prefill.services.map((s) => (
                  <ServiceToggle
                    key={s.id}
                    service={s}
                    selected={selectedIds.has(s.id)}
                    onToggle={() => toggleService(s.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <DeliverySlotPicker
            slots={slots}
            value={deliveryAt}
            onChange={setDeliveryAt}
          />

          <div ref={contactRef} className="space-y-3 rounded-lg bg-muted/30 p-3 transition-all">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="flex items-center gap-1.5 text-sm font-semibold">
                <PhoneCall className="h-3.5 w-3.5" /> Số điện thoại
                <span className="text-rose-600">*</span>
              </Label>
              <Input
                id="phone"
                inputMode="tel"
                placeholder="VD: 0901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="flex items-center gap-1.5 text-sm font-semibold">
                <MapPin className="h-3.5 w-3.5" /> Địa chỉ giao nhận
                <span className="text-rose-600">*</span>
              </Label>
              <Textarea
                id="address"
                rows={2}
                placeholder="Số nhà, đường, phường, quận…"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-sm font-medium">
                Ghi chú (tuỳ chọn)
              </Label>
              <Textarea
                id="note"
                rows={2}
                placeholder="VD: vết bẩn cần xử lý kỹ…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className={cn(
              'h-12 w-full text-base font-semibold shadow-md transition-all',
              selectedIds.size === 0 && 'opacity-50',
            )}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Đang gửi…' : 'Đặt giặt ngay'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ServiceToggle({
  service,
  selected,
  onToggle,
}: {
  service: BookingPrefillService;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200 active:scale-[0.98]',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/40 hover:bg-muted/30',
      )}
    >
      <div
        className={cn(
          'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all',
          selected ? 'border-primary bg-primary' : 'border-muted-foreground/30',
        )}
      >
        {selected && (
          <Check className="h-4 w-4 animate-in text-white zoom-in-50 duration-200" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm font-semibold', selected && 'text-primary')}>
          {service.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {formatCurrency(service.price)} / {service.unit}
        </p>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function SuccessCard() {
  return (
    <Card className="animate-in border-emerald-200 bg-emerald-50/40 shadow-lg fade-in zoom-in-95 slide-in-from-bottom-4 duration-500">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="flex h-14 w-14 animate-in items-center justify-center rounded-full bg-emerald-100 text-emerald-700 zoom-in-50 duration-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-emerald-700">Đã ghi nhận yêu cầu</CardTitle>
          <p className="text-xs text-muted-foreground">
            Tiệm sẽ liên hệ qua số điện thoại của bạn
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-emerald-900/80">
          Cảm ơn bạn đã tin dùng dịch vụ! Vui lòng giữ máy để nhân viên gọi
          xác nhận thời gian lấy đồ trong ít phút nữa.
        </p>
      </CardContent>
    </Card>
  );
}
