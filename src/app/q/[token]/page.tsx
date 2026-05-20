'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  PhoneCall,
  Plus,
  Repeat,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { bookingApi } from '@/services/api/booking.api';
import { extractError } from '@/services/api/client';
import { cn, formatCurrency } from '@/lib/utils';
import type {
  BookingPrefill,
  BookingPrefillActiveOrder,
  BookingPrefillService,
} from '@/types/api';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-xl space-y-4">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Package className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Đặt giặt nhanh</h1>
          {prefillQuery.data?.customer.name && (
            <p className="text-sm text-muted-foreground">
              Xin chào <strong>{prefillQuery.data.customer.name}</strong>
            </p>
          )}
        </div>

        {prefillQuery.isLoading && (
          <Card>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        )}

        {prefillQuery.isError && (
          <Card className="border-rose-200">
            <CardHeader>
              <CardTitle className="text-rose-600">Không mở được trang</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {extractError(prefillQuery.error).message}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Mã QR có thể đã hết hạn. Vui lòng liên hệ tiệm để được hỗ trợ.
              </p>
            </CardContent>
          </Card>
        )}

        {prefillQuery.data && (
          <PublicBookingFlow token={token} prefill={prefillQuery.data} />
        )}

        <div className="pt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
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

// ─────────────────────────────────────────────────────────────────────────────

function PublicBookingFlow({
  token,
  prefill,
}: {
  token: string;
  prefill: BookingPrefill;
}) {
  const [submitted, setSubmitted] = useState<string | null>(null);

  // Fallback an toàn: backend cũ có thể chưa trả về 2 field này
  const activeOrders = prefill.activeOrders ?? [];
  const services = prefill.services ?? [];
  const items = prefill.items ?? [];
  const safePrefill: BookingPrefill = {
    ...prefill,
    activeOrders,
    services,
    items,
  };

  if (submitted) {
    return <SuccessCard code={submitted} />;
  }

  return (
    <div className="space-y-4">
      {activeOrders.length > 0 ? (
        <ActiveOrdersCard orders={activeOrders} />
      ) : (
        <NoActiveOrderCard />
      )}

      <RebookForm
        token={token}
        prefill={safePrefill}
        onSubmitted={(code) => setSubmitted(code)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function NoActiveOrderCard() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Package className="h-5 w-5" />
        </div>
        <p className="text-sm text-muted-foreground">
          Bạn chưa có đơn nào đang xử lý ở tiệm.
        </p>
      </CardContent>
    </Card>
  );
}

function ActiveOrdersCard({ orders }: { orders: BookingPrefillActiveOrder[] }) {
  return (
    <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-blue-600" />
          Đơn đang xử lý
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {orders.map((o) => (
          <div
            key={o.id}
            className="flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2.5 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-mono text-sm font-semibold">
                  {o.code}
                </p>
                <OrderStatusBadge status={o.status} />
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {o.items.length} mặt hàng · {formatCurrency(o.totalAmount)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface DraftItem {
  productId?: string;
  name: string;
  quantity: number;
  weight: string;
  unitPrice: number;
}

interface PhotoEntry {
  id: string;
  dataUrl: string;
}

function RebookForm({
  token,
  prefill,
  onSubmitted,
}: {
  token: string;
  prefill: BookingPrefill;
  onSubmitted: (code: string) => void;
}) {
  const [phone, setPhone] = useState(prefill.customer.phone ?? '');
  const [address, setAddress] = useState(prefill.customer.address ?? '');
  const [pickupAt, setPickupAt] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPhone(prefill.customer.phone ?? '');
    setAddress(prefill.customer.address ?? '');
  }, [prefill.customer.phone, prefill.customer.address]);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
    [items],
  );

  function addServiceById(productId: string) {
    const svc = prefill.services.find((s) => s.id === productId);
    if (!svc) return;
    setItems((arr) => {
      const existed = arr.find((it) => it.productId === productId);
      if (existed) {
        return arr.map((it) =>
          it.productId === productId
            ? { ...it, quantity: it.quantity + 1 }
            : it,
        );
      }
      return [
        ...arr,
        { productId: svc.id, name: svc.name, quantity: 1, weight: '', unitPrice: svc.price },
      ];
    });
  }

  function adjustQuantity(idx: number, delta: number) {
    setItems((arr) =>
      arr
        .map((it, i) =>
          i === idx
            ? { ...it, quantity: Math.max(0, it.quantity + delta) }
            : it,
        )
        .filter((it) => it.quantity > 0),
    );
  }

  function updateItem(idx: number, patch: Partial<DraftItem>) {
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function removeItem(idx: number) {
    setItems((arr) => arr.filter((_, i) => i !== idx));
  }

  function rebookFromSource() {
    setItems(
      prefill.items.map((i) => ({
        productId: i.productId ?? undefined,
        name: i.name,
        quantity: i.quantity,
        weight: i.weight != null ? String(i.weight) : '',
        unitPrice: i.unitPrice,
      })),
    );
    toast.success('Đã thêm các dịch vụ từ đơn trước');
  }

  async function handlePhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const max = 5;
    const remaining = max - photos.length;
    if (remaining <= 0) {
      toast.error(`Tối đa ${max} ảnh`);
      return;
    }
    const list = Array.from(files).slice(0, remaining);
    for (const file of list) {
      try {
        const dataUrl = await compressImage(file, 1024, 0.8);
        setPhotos((arr) => [
          ...arr,
          { id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, dataUrl },
        ]);
      } catch {
        toast.error(`Không đọc được ảnh: ${file.name}`);
      }
    }
  }

  const mutation = useMutation({
    mutationFn: () => {
      const trimmedNote = note.trim();
      const noteWithPhotos =
        photos.length > 0
          ? `${trimmedNote}\n\n[PHOTOS_JSON]${JSON.stringify(photos.map((p) => p.dataUrl))}[/PHOTOS_JSON]`.trim()
          : trimmedNote;

      return bookingApi.createFromQr(token, {
        phone: phone.trim(),
        address: address.trim(),
        pickupAt: pickupAt ? new Date(pickupAt).toISOString() : undefined,
        note: noteWithPhotos || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          weight: i.weight ? Number(i.weight) : undefined,
          unitPrice: i.unitPrice,
        })),
      });
    },
    onSuccess: (booking) => {
      onSubmitted(booking.code);
      toast.success('Đặt giặt thành công!');
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }
    if (!address.trim()) {
      toast.error('Vui lòng nhập địa chỉ');
      return;
    }
    if (items.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 dịch vụ');
      return;
    }
    mutation.mutate();
  }

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Repeat className="h-4 w-4 text-primary" />
          Đặt giặt mới
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={submit} className="space-y-5">
          {/* CTA: Đặt lại y đơn này */}
          {prefill.items.length > 0 && (
            <button
              type="button"
              onClick={rebookFromSource}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-blue-600 px-4 py-4 text-left shadow-lg transition active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-white">
                  <p className="text-xs uppercase tracking-wide opacity-90">
                    Một chạm
                  </p>
                  <p className="text-lg font-bold">Đặt lại y đơn trước</p>
                  <p className="mt-0.5 text-xs opacity-90">
                    {prefill.items.length} mặt hàng từ đơn{' '}
                    <span className="font-mono">{prefill.sourceOrder.code}</span>
                  </p>
                </div>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                  <Repeat className="h-5 w-5" />
                </div>
              </div>
            </button>
          )}

          {/* Service picker */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between text-sm">
              <span className="font-semibold">Dịch vụ bạn muốn đặt</span>
              {items.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {items.length} mục
                </span>
              )}
            </Label>

            <ServiceDropdown
              services={prefill.services}
              onSelect={addServiceById}
            />

            {items.length > 0 && (
              <div className="space-y-2 pt-1">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border bg-card p-3 shadow-sm"
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{it.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(it.unitPrice)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-md border bg-background">
                        <button
                          type="button"
                          onClick={() => adjustQuantity(idx, -1)}
                          className="flex h-9 w-9 items-center justify-center text-lg font-bold hover:bg-muted"
                        >
                          −
                        </button>
                        <span className="min-w-[2rem] text-center font-semibold">
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustQuantity(idx, 1)}
                          className="flex h-9 w-9 items-center justify-center text-lg font-bold hover:bg-muted"
                        >
                          +
                        </button>
                      </div>
                      <Input
                        inputMode="decimal"
                        placeholder="kg (nếu cân)"
                        value={it.weight}
                        onChange={(e) =>
                          updateItem(idx, {
                            weight: e.target.value.replace(',', '.'),
                          })
                        }
                        className="h-9 max-w-[120px] text-sm"
                      />
                      <p className="ml-auto text-sm font-semibold text-primary">
                        {formatCurrency(it.quantity * it.unitPrice)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2.5 text-sm">
                  <span className="font-medium">Tạm tính</span>
                  <span className="text-base font-bold text-primary">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Photo upload */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Chụp đồ của bạn (tuỳ chọn)
            </Label>
            <p className="text-xs text-muted-foreground">
              Giúp tiệm nhận diện đồ của bạn dễ hơn — tối đa 5 ảnh.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              hidden
              onChange={(e) => {
                handlePhotos(e.target.files);
                if (e.target) e.target.value = '';
              }}
            />
            <div className="flex flex-wrap gap-2">
              {photos.map((p) => (
                <div
                  key={p.id}
                  className="relative h-20 w-20 overflow-hidden rounded-lg border bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.dataUrl}
                    alt="Ảnh đính kèm"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setPhotos((arr) => arr.filter((x) => x.id !== p.id))
                    }
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground hover:bg-muted/50"
                >
                  <Camera className="h-5 w-5" />
                  <span className="text-[10px] font-medium">Chụp ảnh</span>
                </button>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3 rounded-lg bg-muted/30 p-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="phone"
                className="flex items-center gap-1.5 text-sm font-semibold"
              >
                <PhoneCall className="h-3.5 w-3.5" /> Số điện thoại
                <span className="text-rose-600">*</span>
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

            <div className="space-y-1.5">
              <Label
                htmlFor="address"
                className="flex items-center gap-1.5 text-sm font-semibold"
              >
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
          </div>

          {/* Optional fields */}
          <details className="rounded-lg border bg-card">
            <summary className="cursor-pointer select-none px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">
              Thêm thời gian lấy & ghi chú (tuỳ chọn)
              <ChevronRight className="ml-1 inline h-3.5 w-3.5" />
            </summary>
            <div className="space-y-3 border-t p-3">
              <div className="space-y-1.5">
                <Label htmlFor="pickupAt" className="text-sm">
                  Thời gian lấy đồ
                </Label>
                <Input
                  id="pickupAt"
                  type="datetime-local"
                  value={pickupAt}
                  onChange={(e) => setPickupAt(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="note" className="text-sm">
                  Ghi chú thêm
                </Label>
                <Textarea
                  id="note"
                  rows={2}
                  placeholder="VD: có vết bẩn cần xử lý kỹ…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </details>

          <Button
            type="submit"
            size="lg"
            className={cn(
              'h-12 w-full text-base font-semibold shadow-md',
              items.length === 0 && 'opacity-60',
            )}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Đang gửi…' : 'Đặt giặt ngay'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Tiệm sẽ liên hệ qua số điện thoại bạn cung cấp.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function ServiceDropdown({
  services,
  onSelect,
}: {
  services: BookingPrefillService[];
  onSelect: (id: string) => void;
}) {
  if (services.length === 0) {
    return (
      <p className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        Tiệm chưa cấu hình dịch vụ. Vui lòng liên hệ tiệm.
      </p>
    );
  }
  return (
    <Select
      value=""
      onValueChange={(v) => v && onSelect(v)}
    >
      <SelectTrigger className="h-11">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Plus className="h-4 w-4" />
          <SelectValue placeholder="Chọn dịch vụ để thêm…" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {services.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            <span className="font-medium">{s.name}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {formatCurrency(s.price)}/{s.unit}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function SuccessCard({ code }: { code: string }) {
  return (
    <Card className="border-emerald-200 bg-emerald-50/40 shadow-lg">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <CardTitle className="text-emerald-700">Đã gửi yêu cầu</CardTitle>
          <p className="text-xs text-muted-foreground">
            Mã đặt lịch:{' '}
            <span className="font-mono font-semibold">{code}</span>
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Cảm ơn bạn! Nhân viên tiệm sẽ liên hệ qua số điện thoại của bạn để
          xác nhận thời gian lấy đồ trong ít phút nữa.
        </p>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Image compression (browser-side) — keeps photos under ~150KB before sending

async function compressImage(
  file: File,
  maxDim = 1024,
  quality = 0.8,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image'));
      img.onload = () => {
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No canvas context'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
