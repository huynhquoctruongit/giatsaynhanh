'use client';

import { Suspense, use, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Download, History, Pencil, Printer, QrCode, Trash2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { PageHeader } from '@/components/common/page-header';
import { Barcode128, encodeCode128 } from '@/components/common/barcode128';
import { orderApi } from '@/services/api/order.api';
import { settingsApi, type ShopSettings } from '@/services/api/settings.api';
import { extractError } from '@/services/api/client';
import { calcInvoiceTotals } from '@/lib/invoice-totals';
import { calcLineTotal, formatCurrency, formatDateTime, orderCodeSuffix } from '@/lib/utils';
import {
  NEXT_STATUS_TRANSITIONS,
  ORDER_STATUS_LABEL,
  type OrderStatus,
} from '@/helpers/enums/order-status';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatDateStr(iso: string) {
  const date = new Date(iso);
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// ─── Build receipt HTML for popup printing ───────────────────────────────────
interface OrderData {
  code: string;
  createdAt: string;
  pickupAt?: string | null;
  fromBooking?: boolean;
  booking?: { code: string } | null;
  customer: { name: string; phone?: string; address?: string | null } | null;
  items: { name: string; quantity: number; weight?: number | null; unitPrice: number }[];
  totalAmount: number;
  discountAmount?: number;
  note?: string | null;
  qr?: { url: string } | null;
}

function barcodeSvgHtml(value: string, width = 220, height = 46, quietZone = 8): string {
  const bits = encodeCode128(value || '');
  if (!bits) return '';
  const drawW = Math.max(width - quietZone * 2, 1);
  const moduleW = drawW / bits.length;
  const rects = bits
    .split('')
    .map((bit, i) =>
      bit === '1'
        ? `<rect x="${(quietZone + i * moduleW).toFixed(2)}" y="0" width="${moduleW.toFixed(3)}" height="${height}" fill="#000"/>`
        : '',
    )
    .join('');
  return `<div style="background:#fff;padding:4px 0;display:flex;justify-content:center">
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${rects}</svg>
  </div>`;
}

function vietQrUrl(settings: ShopSettings, amount: number, addInfo: string): string {
  const url = `https://img.vietqr.io/image/${settings.bankBin}-${settings.bankAccountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}`;
  return settings.bankAccountName ? `${url}&accountName=${encodeURIComponent(settings.bankAccountName)}` : url;
}

function buildReceiptHtml(order: OrderData, settings: ShopSettings): string {
  const base = clamp(settings.invoiceFontSize ?? 15, 12, 26);
  const nameFont = clamp(settings.customerNameFontSize ?? 22, 16, 34);
  const sm = Math.max(base - 2, 9);

  const { subtotal, shippingFee, discount, grandTotal } = calcInvoiceTotals(
    {
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount,
      fromBooking: order.fromBooking,
    },
    settings,
  );

  const showShipping = shippingFee > 0;
  const showDiscount = settings.invoiceShowDebt && discount > 0;

  const itemsHtml = order.items
    .map((it, idx) => {
      const lineTotal = calcLineTotal(it);
      const sl = it.weight ? `${it.quantity} (${it.weight}kg)` : `${it.quantity}`;
      return `<tr>
      <td style="border:1px solid #bbb;padding:3px 5px">${idx + 1}. ${it.name}</td>
      <td style="border:1px solid #bbb;padding:3px 5px;text-align:center;white-space:nowrap">${sl}</td>
      <td style="border:1px solid #bbb;padding:3px 5px;text-align:right;white-space:nowrap">${it.unitPrice.toLocaleString('vi-VN')}</td>
      <td style="border:1px solid #bbb;padding:3px 5px;text-align:right;white-space:nowrap">${lineTotal.toLocaleString('vi-VN')}</td>
    </tr>`;
    })
    .join('');

  const dateStr = formatDateStr(order.createdAt);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: monospace, 'Courier New';
      font-size: ${base}px;
      color: #000;
      background: #fff;
      width: 219px;
      margin: 0 auto;
    }
    @media print {
      @page { margin: 0; size: 58mm auto; }
      body { width: 58mm; margin: 0; }
    }
    .center { text-align: center; }
    .divider { border: none; border-top: 1px dashed #aaa; margin: 6px 8px; }
    table { width: 100%; border-collapse: collapse; font-size: ${sm}px; }
    th { border: 1px solid #bbb; padding: 3px 5px; background: #f5f5f5; }
    .total-row { display:flex; justify-content:space-between; padding: 2px 0; }
    .bold { font-weight: bold; }
  </style>
</head>
<body>
  ${order.fromBooking ? `<div style="text-align:center;padding:8px 10px 0"><span style="display:inline-block;background:#000;color:#fff;border-radius:999px;padding:3px 18px;font-weight:900;letter-spacing:2px;font-size:${base + 2}px">SHIPPING</span></div>` : ''}

  <div style="padding: 10px 10px 4px; text-align: center;">
    ${settings.invoiceShowShopName ? `<p style="font-weight:900;font-size:${base + 4}px;text-transform:uppercase;letter-spacing:0.5px">${settings.shopName || 'TIỆM GIẶT'}</p>` : ''}
    ${settings.invoiceShowPhone && settings.phone ? `<p style="font-weight:600">${settings.phone}</p>` : ''}
    ${settings.invoiceShowAddress && settings.address ? `<p style="font-size:${sm}px;color:#555">Địa chỉ: ${settings.address}</p>` : ''}
  </div>

  <hr class="divider"/>

  <div style="padding: 4px 10px; text-align: center;">
    <p style="font-weight:700">HÓA ĐƠN</p>
    <p style="font-size:${sm}px;color:#555">${order.code} · ${dateStr}</p>
    ${settings.invoiceShowBarcode ? barcodeSvgHtml(orderCodeSuffix(order.code)) : ''}
  </div>

  <hr class="divider"/>

  <div style="padding: 4px 10px 6px; text-align:center;">
    <p style="font-size:${nameFont}px;font-weight:900;line-height:1.2;word-break:break-word">${order.customer?.name ?? '—'}</p>
    ${order.customer?.phone ? `<p style="font-size:${sm}px;color:#444">SĐT: ${order.customer.phone}</p>` : ''}
    ${order.customer?.address ? `<p style="font-size:${sm}px;color:#444">ĐC: ${order.customer.address}</p>` : ''}
    ${order.note ? `<p style="font-size:${sm}px;color:#444">Ghi chú: ${order.note}</p>` : ''}
  </div>

  <div style="padding: 0 8px 6px;">
    <table>
      <thead>
        <tr>
          <th style="text-align:left">Dịch vụ</th>
          <th style="text-align:center;white-space:nowrap">SL</th>
          <th style="text-align:right;white-space:nowrap">Đơn giá</th>
          <th style="text-align:right;white-space:nowrap">Thành tiền</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
  </div>

  <hr class="divider"/>

  <div style="padding: 2px 10px 4px;">
    ${showShipping ? `
    <div class="total-row" style="font-size:${sm}px;color:#555">
      <span>Tạm tính</span><span>${subtotal.toLocaleString('vi-VN')}đ</span>
    </div>
    <div class="total-row" style="font-size:${sm}px;color:#555">
      <span>Phí ship</span><span>${shippingFee.toLocaleString('vi-VN')}đ</span>
    </div>` : ''}
    ${showDiscount ? `
    <div class="total-row" style="font-size:${sm}px;color:#555">
      <span>Giảm giá</span><span>- ${discount.toLocaleString('vi-VN')}đ</span>
    </div>` : ''}
    <div class="total-row bold" style="font-size:${base + 1}px">
      <span>TỔNG CỘNG</span><span>${grandTotal.toLocaleString('vi-VN')}đ</span>
    </div>
  </div>

  ${settings.bankBin && settings.bankAccountNumber ? `<div style="text-align:center;padding:2px 10px 4px">
    <p style="font-size:${sm}px;font-weight:700;margin-bottom:2px">Quét mã chuyển khoản</p>
    <img src="${vietQrUrl(settings, grandTotal, order.code)}" style="width:160px;height:160px;display:block;margin:0 auto" />
  </div>` : ''}

  <hr class="divider"/>
  <div style="text-align:center;padding:4px 10px 6px;font-size:${sm}px;color:#555">
    ${settings.openingHours ? `<p>Giờ mở cửa: ${settings.openingHours}</p>` : ''}
    <p style="margin-top:2px;font-weight:700">Cảm ơn quý khách! Hẹn gặp lại.</p>
  </div>

  ${settings.invoiceNote ? `<div style="margin:8px 10px 4px;padding:8px;border:2px solid #000;border-radius:6px;text-align:center">
    <p style="font-weight:900;font-size:${base}px;line-height:1.6">${settings.invoiceNote.split('\n').join('<br/>')}</p>
  </div>` : ''}

  <div style="height:16px"></div>
</body>
</html>`;
}

// ─── Silent-print via popup ───────────────────────────────────────────────────
function printReceipt(html: string) {
  const popup = window.open('', '_blank', 'width=320,height=600,scrollbars=no,toolbar=no,menubar=no');
  if (!popup) {
    toast.error('Popup bị chặn. Hãy cho phép popup cho trang này.');
    return;
  }

  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    popup.print();
    popup.addEventListener('afterprint', () => popup.close(), { once: true });
  };

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();

  // onload fires when images finish loading
  popup.onload = doPrint;
  // Fallback for documents with no external resources (load fires synchronously before onload is set)
  setTimeout(doPrint, 600);
}

// ─── Inline receipt preview (fluid, fills container) ─────────────────────────
function InvoicePreviewPanel({ order, settings }: { order: OrderData & { code: string }; settings: ShopSettings }) {
  const base = clamp(settings.invoiceFontSize ?? 15, 12, 26);
  const nameFont = clamp(settings.customerNameFontSize ?? 22, 16, 34);
  const sm = Math.max(base - 2, 9);

  const dateStr = formatDateStr(order.createdAt);

  const { subtotal, shippingFee, discount, grandTotal } = calcInvoiceTotals(
    {
      totalAmount: Number(order.totalAmount),
      discountAmount: order.discountAmount,
      fromBooking: order.fromBooking,
    },
    settings,
  );
  const showShipping = shippingFee > 0;
  const showDiscount = settings.invoiceShowDebt && discount > 0;

  return (
    <div style={{ fontFamily: 'monospace', fontSize: base, color: '#000', width: 219, margin: '0 auto', lineHeight: 1.4 }}>
      {order.fromBooking && (
        <div style={{ textAlign: 'center', paddingTop: 4, paddingBottom: 4 }}>
          <span style={{ display: 'inline-block', background: '#000', color: '#fff', borderRadius: 999, padding: '3px 18px', fontWeight: 900, letterSpacing: 2, fontSize: base + 2 }}>
            SHIPPING
          </span>
        </div>
      )}

      {/* Header */}
      <div style={{ paddingBottom: 4, textAlign: 'center' }}>
        {settings.invoiceShowShopName && (
          <p style={{ fontWeight: 900, fontSize: base + 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {settings.shopName || 'TIỆM GIẶT'}
          </p>
        )}
        {settings.invoiceShowPhone && settings.phone && (
          <p style={{ fontWeight: 600 }}>{settings.phone}</p>
        )}
        {settings.invoiceShowAddress && settings.address && (
          <p style={{ fontSize: sm, color: '#555' }}>Địa chỉ: {settings.address}</p>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '1px dashed #aaa', margin: '4px 8px' }} />

      {/* Invoice info */}
      <div style={{ padding: '4px 10px', textAlign: 'center' }}>
        <p style={{ fontWeight: 700 }}>HÓA ĐƠN</p>
        <p style={{ fontSize: sm, color: '#555' }}>{order.code} · {dateStr}</p>
        {settings.invoiceShowBarcode && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
            <Barcode128 value={orderCodeSuffix(order.code)} width={200} height={44} />
          </div>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '1px dashed #aaa', margin: '4px 8px' }} />

      {/* Customer */}
      <div style={{ padding: '4px 10px 6px', textAlign: 'center' }}>
        <p style={{ fontSize: nameFont, fontWeight: 900, lineHeight: 1.2, wordBreak: 'break-word' }}>
          {order.customer?.name ?? '—'}
        </p>
        {order.customer?.phone && (
          <p style={{ fontSize: sm, color: '#444' }}>SĐT: {order.customer.phone}</p>
        )}
        {order.customer?.address && (
          <p style={{ fontSize: sm, color: '#444' }}>ĐC: {order.customer.address}</p>
        )}
        {order.note && (
          <p style={{ fontSize: sm, color: '#444' }}>Ghi chú: {order.note}</p>
        )}
      </div>

      {/* Items table */}
      <div style={{ padding: '0 8px 6px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: sm }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #bbb', padding: '3px 5px', textAlign: 'left' }}>Dịch vụ</th>
              <th style={{ border: '1px solid #bbb', padding: '3px 5px', textAlign: 'center', whiteSpace: 'nowrap' }}>SL</th>
              <th style={{ border: '1px solid #bbb', padding: '3px 5px', textAlign: 'right', whiteSpace: 'nowrap' }}>Đơn giá</th>
              <th style={{ border: '1px solid #bbb', padding: '3px 5px', textAlign: 'right', whiteSpace: 'nowrap' }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #bbb', padding: '3px 5px' }}>{i + 1}. {it.name}</td>
                <td style={{ border: '1px solid #bbb', padding: '3px 5px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {it.weight ? `${it.quantity} (${it.weight}kg)` : it.quantity}
                </td>
                <td style={{ border: '1px solid #bbb', padding: '3px 5px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {it.unitPrice.toLocaleString('vi-VN')}
                </td>
                <td style={{ border: '1px solid #bbb', padding: '3px 5px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {calcLineTotal(it).toLocaleString('vi-VN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr style={{ border: 'none', borderTop: '1px dashed #aaa', margin: '4px 8px' }} />

      {/* Totals */}
      <div style={{ padding: '2px 10px 4px' }}>
        {showShipping && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: sm, color: '#555' }}>
              <span>Tạm tính</span>
              <span>{subtotal.toLocaleString('vi-VN')}đ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: sm, color: '#555' }}>
              <span>Phí ship</span>
              <span>{shippingFee.toLocaleString('vi-VN')}đ</span>
            </div>
          </>
        )}
        {showDiscount && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: sm, color: '#555' }}>
            <span>Giảm giá</span>
            <span>- {discount.toLocaleString('vi-VN')}đ</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: base + 1 }}>
          <span>TỔNG CỘNG</span>
          <span>{grandTotal.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      {/* QR chuyển khoản đúng số tiền */}
      {settings.bankBin && settings.bankAccountNumber && (
        <div style={{ textAlign: 'center', padding: '2px 10px 4px' }}>
          <p style={{ fontSize: sm, fontWeight: 700, marginBottom: 2 }}>Quét mã chuyển khoản</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={vietQrUrl(settings, grandTotal, order.code)}
            alt={`VietQR ${order.code}`}
            style={{ width: 160, height: 160, display: 'block', margin: '0 auto' }}
          />
        </div>
      )}

      {/* Footer */}
      <hr style={{ border: 'none', borderTop: '1px dashed #aaa', margin: '4px 8px' }} />
      <div style={{ textAlign: 'center', padding: '4px 10px 6px', fontSize: sm, color: '#555' }}>
        {settings.openingHours && <p>Giờ mở cửa: {settings.openingHours}</p>}
        <p style={{ marginTop: 2, fontWeight: 700 }}>Cảm ơn quý khách! Hẹn gặp lại.</p>
      </div>

      {/* Ghi chú cuối hoá đơn (riêng từng tiệm) */}
      {settings.invoiceNote && (
        <div style={{ margin: '8px 10px 4px', padding: 8, border: '2px solid #000', borderRadius: 6, textAlign: 'center' }}>
          <p style={{ fontWeight: 900, fontSize: base, lineHeight: 1.6 }}>
            {settings.invoiceNote.split('\n').map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function OrderDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const qrRef = useRef<HTMLDivElement>(null);
  const autoPrintedRef = useRef(false);

  const orderQuery = useQuery({ queryKey: ['order', id], queryFn: () => orderApi.detail(id) });
  const qrQuery = useQuery({ queryKey: ['order', id, 'qr'], queryFn: () => orderApi.qrDataUrl(id), enabled: !!orderQuery.data });
  const historyQuery = useQuery({ queryKey: ['order', id, 'scan-history'], queryFn: () => orderApi.scanHistory(id), enabled: !!orderQuery.data });
  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: settingsApi.get });

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => orderApi.updateStatus(id, status),
    onSuccess: (data) => {
      toast.success(`Đã chuyển sang: ${ORDER_STATUS_LABEL[data.status]}`);
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => orderApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xoá đơn');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      router.push('/admin/orders');
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  function handleDelete() {
    if (window.confirm(`Xoá đơn ${orderQuery.data?.code ?? ''}?\nHành động này không thể hoàn tác.`)) {
      deleteMutation.mutate();
    }
  }

  const order = orderQuery.data;
  const settings = settingsQuery.data;

  function handlePrint() {
    if (!order || !settings) { toast.error('Chưa tải được cài đặt hóa đơn'); return; }
    const html = buildReceiptHtml(order, settings);
    printReceipt(html);
  }

  useEffect(() => {
    if (autoPrintedRef.current) return;
    if (!order || !settings) return;
    if (searchParams.get('autoPrint') !== '1') return;
    autoPrintedRef.current = true;
    handlePrint();
    router.replace(`/admin/orders/${id}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, settings, searchParams]);

  if (orderQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">Không tìm thấy đơn</p>
        <Button variant="ghost" asChild className="mt-3">
          <Link href="/admin/orders"><ArrowLeft className="h-4 w-4" /> Quay lại</Link>
        </Button>
      </div>
    );
  }

  // Admin: đổi sang BẤT KỲ trạng thái nào (trừ trạng thái hiện tại).
  // Nhân viên: theo luồng cho phép.
  const allStatuses = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[];
  const statusOptions: OrderStatus[] = isAdmin
    ? allStatuses.filter((s) => s !== order.status)
    : NEXT_STATUS_TRANSITIONS[order.status];

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.customer?.name ?? '—'}
        description={`Mã đơn ${order.code} · Tạo lúc ${formatDateTime(order.createdAt)}`}
        actions={
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/admin/orders/new?edit=${id}`}>
                    <Pencil className="h-4 w-4" /> Sửa
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" /> Xoá
                </Button>
              </>
            )}
            <Button variant="ghost" asChild>
              <Link href="/admin/orders"><ArrowLeft className="h-4 w-4" /> Tất cả đơn</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left: order info ── */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="relative overflow-hidden">
            {/* Dấu "giao tận nhà" cho đơn đặt lịch — mép trái, giữa (kiểu giáp lai) */}
            {order.fromBooking && (
              <div className="pointer-events-none absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                <div className="flex -rotate-90 items-center gap-1.5 rounded-md border-2 border-sky-500 bg-sky-50 px-3 py-1 text-sky-600 shadow-sm">
                  <Truck className="h-4 w-4" />
                  <span className="text-xs font-extrabold tracking-wide">GIAO TẬN NHÀ</span>
                </div>
              </div>
            )}
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle>Thông tin đơn</CardTitle>
                <OrderStatusBadge status={order.status} />
                {order.fromBooking && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                    <Truck className="h-3 w-3" /> Đặt lịch
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Khách hàng</p>
                <p className="font-medium">{order.customer?.name ?? '-'}</p>
                <p className="text-sm text-muted-foreground">{order.customer?.phone}</p>
                {order.customer?.address && (
                  <p className="mt-1 text-xs text-muted-foreground">{order.customer.address}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Hẹn lấy đồ</p>
                <p className="font-medium">{formatDateTime(order.pickupAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Đã giao lúc</p>
                <p className="font-medium">{formatDateTime(order.deliveredAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ghi chú</p>
                <p className="text-sm">{order.note || '-'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Sản phẩm</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {order.items.map((it) => (
                  <div key={it.id ?? it.name} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{it.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.quantity} × {formatCurrency(it.unitPrice)}
                        {it.weight ? ` · ${it.weight}kg` : ''}
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(it.subtotal ?? calcLineTotal(it))}</p>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Tổng cộng</p>
                <p className="text-xl font-bold">{formatCurrency(order.totalAmount)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <History className="h-4 w-4" />
              <CardTitle>Lịch sử scan</CardTitle>
            </CardHeader>
            <CardContent>
              {historyQuery.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (historyQuery.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có lượt scan nào.</p>
              ) : (
                <div className="space-y-2">
                  {historyQuery.data?.map((h) => (
                    <div key={h.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                      <div>
                        <p className="font-medium">
                          {h.action === 'UPDATE_STATUS' ? 'Cập nhật trạng thái' : 'Xem QR'}{' '}
                          {h.user ? `· ${h.user.name}` : '· Khách (ẩn danh)'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {h.ip ?? '-'} · {h.userAgent?.slice(0, 60) ?? '-'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDateTime(h.scannedAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right: QR + invoice preview + actions ── */}
        <div className="space-y-4">
          {/* Prominent QR card */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <QrCode className="h-4 w-4 text-primary" /> Mã QR đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3" ref={qrRef}>
              {qrQuery.isLoading ? (
                <Skeleton className="mx-auto h-48 w-48" />
              ) : qrQuery.data ? (
                <>
                  <div className="flex justify-center rounded-lg border bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrQuery.data.dataUrl}
                      alt={`QR ${order.code}`}
                      className="h-48 w-48"
                    />
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    Khách quét để xem đơn & đặt lại lần sau
                  </p>
                  <p className="break-all rounded-md bg-muted px-2 py-1.5 text-center font-mono text-[10px] text-muted-foreground">
                    {order.qr?.url}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(order.qr?.url ?? '');
                        toast.success('Đã copy URL');
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy URL
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = qrQuery.data.dataUrl;
                        a.download = `qr-${order.code}.png`;
                        a.click();
                      }}
                    >
                      <Download className="h-3.5 w-3.5" /> Tải PNG
                    </Button>
                  </div>
                </>
              ) : (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  Không tải được QR
                </p>
              )}
            </CardContent>
          </Card>

          {/* Invoice preview card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Hóa đơn</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Receipt preview */}
              <div className="flex justify-center border-t bg-white px-3 py-3">
                {settingsQuery.isLoading || orderQuery.isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : settings ? (
                  <InvoicePreviewPanel order={order} settings={settings} />
                ) : (
                  <p className="py-8 text-center text-xs text-muted-foreground">Chưa tải được cài đặt</p>
                )}
              </div>

              {/* Print actions */}
              <div className="space-y-2 p-3">
                <Button className="w-full" onClick={handlePrint} disabled={!settings}>
                  <Printer className="h-4 w-4" /> In hóa đơn
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Tip: Chạy Chrome với{' '}
                  <code className="rounded bg-muted px-1 font-mono">--kiosk-printing</code>{' '}
                  để bỏ qua dialog in
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status update card */}
          <Card>
            <CardHeader>
              <CardTitle>Cập nhật trạng thái</CardTitle>
              {isAdmin && (
                <p className="text-xs text-muted-foreground">
                  Quản trị viên có thể đặt sang bất kỳ trạng thái nào.
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {statusOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Đơn đã ở trạng thái cuối.</p>
              ) : (
                statusOptions.map((s) => (
                  <Button
                    key={s}
                    variant={s === 'CANCELLED' ? 'outline' : 'default'}
                    className="w-full justify-start"
                    onClick={() => statusMutation.mutate(s)}
                    disabled={statusMutation.isPending}
                  >
                    Chuyển sang: {ORDER_STATUS_LABEL[s]}
                  </Button>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <OrderDetailContent params={params} />
    </Suspense>
  );
}
