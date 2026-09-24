'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Minus, Plus, Search, ShoppingCart, Trash2, UserPlus, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/common/page-header';
import { customerApi } from '@/services/api/customer.api';
import { productApi } from '@/services/api/product.api';
import { orderApi } from '@/services/api/order.api';
import { settingsApi } from '@/services/api/settings.api';
import { extractError } from '@/services/api/client';
import { calcLineTotal, cn, formatCurrency, getEffectivePrice } from '@/lib/utils';
import type { Customer, Product } from '@/types/api';

/** Tên dòng phí giao hàng — thêm vào items khi tích "Giao hàng tận nhà". */
const SHIP_ITEM_NAME = 'Phí giao hàng';

interface DraftItem {
  productId?: string;
  name: string;
  quantity: number;
  weight: string;
  unitPrice: number;
}

function NewOrderForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit') ?? undefined;
  const isEditMode = !!editId;

  const [customerId, setCustomerId] = useState('');
  const [customer, setCustomer] = useState<Customer | undefined>();
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [qaName, setQaName] = useState('');
  const [qaPhone, setQaPhone] = useState('');
  const [qaAddress, setQaAddress] = useState('');

  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const [items, setItems] = useState<DraftItem[]>([]);
  const [note, setNote] = useState('');
  const [pickupAt, setPickupAt] = useState('');
  const [hasDelivery, setHasDelivery] = useState(false);

  const editQuery = useQuery({
    queryKey: ['order', editId],
    queryFn: () => orderApi.detail(editId!),
    enabled: isEditMode,
  });

  const customersQuery = useQuery({
    queryKey: ['customers', 'pick', { search: customerSearch }],
    queryFn: () => customerApi.list({ search: customerSearch || undefined, pageSize: 100 }),
  });

  const productsQuery = useQuery({
    queryKey: ['products', 'active'],
    queryFn: () => productApi.list({ isActive: true, pageSize: 200 }),
  });

  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: settingsApi.get });

  // Đơn đang sửa mà fromBooking đã tự cộng phí ship ở hoá đơn → không hiện toggle
  // giao hàng để tránh tính 2 lần.
  const showDeliveryToggle = !editQuery.data?.fromBooking;
  const shipFee = Number(settingsQuery.data?.bookingShippingFee ?? 0);
  const deliveryFee = showDeliveryToggle && hasDelivery && shipFee > 0 ? shipFee : 0;

  // Pre-fill khi edit
  useEffect(() => {
    const o = editQuery.data;
    if (!o) return;
    setCustomerId(o.customer?.id ?? '');
    if (o.customer) {
      setCustomer({
        id: o.customer.id ?? '',
        name: o.customer.name,
        phone: o.customer.phone ?? null,
        address: o.customer.address ?? null,
        note: null,
        createdAt: '',
        updatedAt: '',
      });
    }
    setNote(o.note ?? '');
    setPickupAt(o.pickupAt ? o.pickupAt.slice(0, 16) : '');
    setHasDelivery(o.items.some((it) => it.name === SHIP_ITEM_NAME));
    setItems(
      o.items
        .filter((it) => it.name !== SHIP_ITEM_NAME)
        .map((it) => ({
          productId: it.productId ?? undefined,
          name: it.name,
          quantity: Number(it.quantity),
          weight: it.weight ? String(it.weight) : '',
          unitPrice: Number(it.unitPrice),
        })),
    );
  }, [editQuery.data]);

  const createCustomerMutation = useMutation({
    mutationFn: () =>
      customerApi.create({ name: qaName, phone: qaPhone || undefined, address: qaAddress || undefined }),
    onSuccess: (c) => {
      toast.success('Đã thêm khách hàng');
      setCustomerId(c.id);
      setCustomer(c);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setQuickAddOpen(false);
      setQaName('');
      setQaPhone('');
      setQaAddress('');
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const total = items.reduce((sum, i) => sum + calcLineTotal(i), 0);

  function orderPayload() {
    return {
      customerId,
      note: note || undefined,
      pickupAt: pickupAt || undefined,
      items: [
        ...items.map((i) => ({
          productId: i.productId || undefined,
          name: i.name,
          quantity: Number(i.quantity),
          weight: i.weight ? Number(i.weight) : undefined,
          unitPrice: Number(i.unitPrice),
        })),
        ...(deliveryFee > 0 ? [{ name: SHIP_ITEM_NAME, quantity: 1, unitPrice: deliveryFee }] : []),
      ],
    };
  }

  const mutation = useMutation({
    mutationFn: () =>
      isEditMode ? orderApi.update(editId!, orderPayload()) : orderApi.create(orderPayload()),
    onSuccess: (order) => {
      toast.success(isEditMode ? 'Đã cập nhật đơn' : `Tạo đơn ${order.code} thành công`);
      if (isEditMode) {
        router.push(`/admin/orders/${order.id}`);
      } else {
        router.push(`/admin/orders/${order.id}?autoPrint=1`);
      }
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  function addProduct(p: Product) {
    setItems((arr) => {
      const idx = arr.findIndex((it) => it.productId === p.id);
      if (idx >= 0) {
        return arr.map((it, i) => {
          if (i !== idx) return it;
          const next = it.quantity + 1;
          return { ...it, quantity: next, unitPrice: getEffectivePrice(p, next) };
        });
      }
      return [
        ...arr,
        { productId: p.id, name: p.name, quantity: 1, weight: '', unitPrice: getEffectivePrice(p, 1) },
      ];
    });
  }

  function adjustQuantity(i: number, delta: number) {
    setItems((arr) =>
      arr.map((it, idx) => {
        if (idx !== i) return it;
        const next = Math.max(1, it.quantity + delta);
        const product = productsQuery.data?.items.find((p) => p.id === it.productId);
        const price = product?.wholesaleEnabled ? getEffectivePrice(product, next) : it.unitPrice;
        return { ...it, quantity: next, unitPrice: price };
      }),
    );
  }

  function setQuantityInput(i: number, value: string) {
    const qty = Math.max(1, parseInt(value, 10) || 1);
    setItems((arr) =>
      arr.map((it, idx) => {
        if (idx !== i) return it;
        const product = productsQuery.data?.items.find((p) => p.id === it.productId);
        const price = product?.wholesaleEnabled ? getEffectivePrice(product, qty) : it.unitPrice;
        return { ...it, quantity: qty, unitPrice: price };
      }),
    );
  }

  function updateWeight(i: number, value: string) {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, weight: value.replace(',', '.') } : it)));
  }

  function removeItem(i: number) {
    setItems((arr) => arr.filter((_, idx) => idx !== i));
  }

  function handleSubmit() {
    if (!customerId) {
      toast.error('Vui lòng chọn khách hàng');
      return;
    }
    if (items.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 dịch vụ');
      return;
    }
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.name.trim()) {
        toast.error(`Vui lòng chọn dịch vụ cho dòng ${i + 1}`);
        return;
      }
      if (it.quantity <= 0) {
        toast.error('Số lượng phải > 0');
        return;
      }
    }
    mutation.mutate();
  }

  const priorityProducts = (productsQuery.data?.items ?? []).slice(0, 4);
  const filteredProducts = (productsQuery.data?.items ?? []).filter((p) =>
    p.name.toLowerCase().includes(productSearch.trim().toLowerCase()),
  );

  return (
    <div className="space-y-6 pb-32">
      <PageHeader
        title={isEditMode ? 'Sửa đơn' : 'Tạo đơn giặt sấy'}
        description={isEditMode ? 'Cập nhật thông tin & sản phẩm của đơn' : 'Chọn khách, chạm dịch vụ để thêm vào giỏ'}
        actions={
          <Button variant="ghost" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="h-4 w-4" /> Danh sách đơn
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ===== Cột trái: khách hàng + dịch vụ nhanh + thông tin thêm ===== */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Khách hàng</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {customer ? (
                <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <UserRound className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{customer.name}</p>
                    {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
                    {customer.address && (
                      <p className="truncate text-xs text-muted-foreground">{customer.address}</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCustomerPickerOpen(true)}>
                    Đổi
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button className="flex-1" onClick={() => setCustomerPickerOpen(true)}>
                    <Search className="h-4 w-4" /> Chọn khách hàng
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuickAddOpen(true)}
                    aria-label="Thêm mới khách hàng"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Chọn dịch vụ</CardTitle></CardHeader>
            <CardContent>
              {productsQuery.isLoading ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Đang tải dịch vụ…</p>
              ) : priorityProducts.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Chưa có dịch vụ nào</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {priorityProducts.map((p) => {
                    const added = items.find((it) => it.productId === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addProduct(p)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-lg border-[1.5px] px-3 py-2 text-sm font-semibold transition-colors',
                          added
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-primary/60 bg-primary/5 text-primary hover:bg-primary/10',
                        )}
                      >
                        {added ? <span>✓</span> : <Plus className="h-4 w-4" />}
                        <span className="max-w-[10rem] truncate">{p.name}</span>
                        {added && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-primary">
                            {added.quantity}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setProductPickerOpen(true)}
                    className="flex items-center gap-1 rounded-lg border-[1.5px] border-dashed px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    … Thêm
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Thông tin thêm</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pickupAt">Hẹn lấy đồ (tuỳ chọn)</Label>
                <Input
                  id="pickupAt"
                  type="datetime-local"
                  value={pickupAt}
                  onChange={(e) => setPickupAt(e.target.value)}
                />
              </div>

              {showDeliveryToggle && (
                <label
                  htmlFor="hasDelivery"
                  className={cn(
                    'flex items-center gap-3 rounded-lg border p-3',
                    shipFee > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
                  )}
                >
                  <input
                    id="hasDelivery"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={hasDelivery}
                    disabled={shipFee <= 0}
                    onChange={(e) => setHasDelivery(e.target.checked)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Giao hàng tận nhà</p>
                    <p className="text-xs text-muted-foreground">
                      {shipFee > 0
                        ? `Cộng phí ship ${formatCurrency(shipFee)} vào tổng đơn`
                        : 'Chưa cài phí ship trong Cài đặt'}
                    </p>
                  </div>
                </label>
              )}

              <div className="space-y-2">
                <Label htmlFor="note">Ghi chú</Label>
                <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===== Cột phải: giỏ đơn ===== */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Giỏ đơn{items.length ? ` (${items.length})` : ''}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <ShoppingCart className="h-9 w-9 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Chạm vào dịch vụ bên trái để thêm vào đơn
                  </p>
                </div>
              ) : (
                items.map((it, i) => (
                  <div key={i} className="space-y-3 rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">{i + 1}.</span>
                      <p className="flex-1 truncate font-medium">{it.name}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(i)}
                        aria-label="Xoá dòng"
                      >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">SL</Label>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => adjustQuantity(i, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            value={it.quantity}
                            onChange={(e) => setQuantityInput(i, e.target.value)}
                            className="text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => adjustQuantity(i, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Cân (kg)</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="—"
                          value={it.weight}
                          onChange={(e) => updateWeight(i, e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Đơn giá</Label>
                        <Input
                          type="number"
                          min={0}
                          value={it.unitPrice}
                          onChange={(e) =>
                            setItems((arr) =>
                              arr.map((row, idx) =>
                                idx === i ? { ...row, unitPrice: Number(e.target.value) || 0 } : row,
                              ),
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2">
                      <p className="text-xs text-muted-foreground">
                        Thành tiền
                        {it.weight && Number(it.weight) > 0
                          ? ` (${it.weight}kg × ${formatCurrency(it.unitPrice)}${it.quantity > 1 ? ` × ${it.quantity}` : ''})`
                          : ''}
                      </p>
                      <p className="font-bold text-primary">{formatCurrency(calcLineTotal(it))}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Customer picker modal */}
      <Dialog open={customerPickerOpen} onOpenChange={setCustomerPickerOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Chọn khách hàng</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Tìm tên, SĐT..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {!customersQuery.data?.items || customersQuery.data.items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6">
                  <p className="text-sm text-muted-foreground">Không tìm thấy khách hàng nào</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomerPickerOpen(false);
                      setQuickAddOpen(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4" /> Thêm khách mới
                  </Button>
                </div>
              ) : (
                customersQuery.data.items.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCustomerId(c.id);
                      setCustomer(c);
                      setCustomerPickerOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md p-2.5 text-left hover:bg-muted"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCustomerPickerOpen(false);
                setQuickAddOpen(true);
              }}
            >
              <UserPlus className="h-4 w-4" /> Thêm mới
            </Button>
            <Button variant="ghost" onClick={() => setCustomerPickerOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick add customer */}
      <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thêm khách hàng nhanh</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Tên *</Label>
              <Input value={qaName} onChange={(e) => setQaName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại (không bắt buộc)</Label>
              <Input value={qaPhone} onChange={(e) => setQaPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Địa chỉ</Label>
              <Input value={qaAddress} onChange={(e) => setQaAddress(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setQuickAddOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={() => {
                if (!qaName.trim()) {
                  toast.error('Vui lòng nhập tên khách hàng');
                  return;
                }
                createCustomerMutation.mutate();
              }}
              disabled={createCustomerMutation.isPending}
            >
              {createCustomerMutation.isPending ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product picker modal */}
      <Dialog open={productPickerOpen} onOpenChange={setProductPickerOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tất cả dịch vụ</DialogTitle></DialogHeader>
          <p className="-mt-2 text-xs text-muted-foreground">Chạm để thêm vào đơn · có thể chọn nhiều</p>
          <Input
            placeholder="Tìm dịch vụ..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
          {productsQuery.isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Đang tải dịch vụ…</p>
          ) : filteredProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Không tìm thấy dịch vụ nào</p>
          ) : (
            <div className="max-h-96 space-y-1 overflow-y-auto">
              {filteredProducts.map((p) => {
                const added = items.find((it) => it.productId === p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md border p-2.5 text-left hover:bg-muted',
                      added && 'border-primary',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.unit}
                        {p.wholesaleEnabled ? ' · Bán sỉ' : ''}
                      </p>
                      {p.wholesaleEnabled && p.wholesaleTiers && p.wholesaleTiers.length > 0 && (
                        <p className="text-[11px] text-blue-600">
                          {[...p.wholesaleTiers]
                            .sort((a, b) => a.minQty - b.minQty)
                            .map((t) => `≥${t.minQty}: ${formatCurrency(t.price)}`)
                            .join('  ·  ')}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 font-semibold text-primary">{formatCurrency(p.price)}</p>
                    {added && (
                      <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                        {added.quantity}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setProductPickerOpen(false)}>Xong</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer cố định — tổng tiền + nút tạo đơn */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {deliveryFee > 0 && (
              <p className="text-sm text-muted-foreground">
                Phí giao hàng: <span className="font-medium text-foreground">+{formatCurrency(deliveryFee)}</span>
              </p>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Tổng cộng</p>
              <p className="text-2xl font-bold">{formatCurrency(total + deliveryFee)}</p>
            </div>
          </div>
          <Button size="lg" onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang lưu…' : isEditMode ? 'Lưu thay đổi' : 'Tạo đơn'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={null}>
      <NewOrderForm />
    </Suspense>
  );
}
