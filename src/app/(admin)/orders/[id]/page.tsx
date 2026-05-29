'use client';

import { use, useRef } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Copy, Download, History, Printer, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderStatusBadge } from '@/components/common/order-status-badge';
import { PageHeader } from '@/components/common/page-header';
import { orderApi } from '@/services/api/order.api';
import { settingsApi, type ShopSettings } from '@/services/api/settings.api';
import { extractError } from '@/services/api/client';
import { calcInvoiceTotals } from '@/lib/invoice-totals';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  NEXT_STATUS_TRANSITIONS,
  ORDER_STATUS_LABEL,
  type OrderStatus,
} from '@/helpers/enums/order-status';

// ─── Barcode SVG (decorative) ─────────────────────────────────────────────────
function BarcodeGraphic({ code }: { code: string }) {
  const bars = [3,1,2,1,3,2,1,2,1,3,1,2,3,1,1,2,3,1,2,1,1,3,2,1,3,2,1,1,2,3,1];
  let x = 0;
  const rects: { x: number; w: number }[] = [];
  bars.forEach((w, i) => { if (i % 2 === 0) rects.push({ x, w }); x += w; });
  const totalW = x;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox={`0 0 ${totalW} 36`} style={{ width: '100%', maxWidth: 200, height: 36, display: 'block', margin: '0 auto' }}>
        {rects.map((r, i) => <rect key={i} x={r.x} y={0} width={r.w} height={36} fill="black" />)}
      </svg>
      <p style={{ fontSize: 9, color: '#666', marginTop: 2 }}>{code}</p>
    </div>
  );
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
  qr?: { url: string } | null;
}

function deliveryBookingTagHtml(
  order: Pick<OrderData, 'fromBooking' | 'pickupAt' | 'booking'>,
  base: number,
  sm: number,
): string {
  if (!order.fromBooking) return '';
  const bookingLine = order.booking?.code
    ? `<p style="font-size:${sm}px;color:#444;margin-top:2px">${order.booking.code}</p>`
    : '';
  const pickupLine = order.pickupAt
    ? `<p style="font-size:${sm}px;margin-top:2px">Hẹn lấy: ${formatDateTime(order.pickupAt)}</p>`
    : '';
  return `
  <div style="margin:6px 10px;padding:8px;border:2px solid #000;text-align:center">
    <p style="font-weight:900;font-size:${base + 3}px;letter-spacing:1px">GIAO NHẬN</p>
    <p style="font-size:${sm}px;margin-top:2px">Đơn đặt qua mã QR — shipper đi giao</p>
    ${bookingLine}
    ${pickupLine}
  </div>`;
}

function buildReceiptHtml(order: OrderData, settings: ShopSettings, qrDataUrl?: string): string {
  const base = settings.invoiceFontSize ?? 13;
  const customerFs = settings.customerNameFontSize ?? 22;
  const sm = Math.max(base - 2, 9);

  const barsHtml = (() => {
    const bars = [3,1,2,1,3,2,1,2,1,3,1,2,3,1,1,2,3,1,2,1,1,3,2,1,3,2,1,1,2,3,1];
    let x = 0;
    const rects: string[] = [];
    bars.forEach((w, i) => {
      if (i % 2 === 0) rects.push(`<rect x="${x}" y="0" width="${w}" height="36" fill="black"/>`);
      x += w;
    });
    return `<svg viewBox="0 0 ${x} 36" style="width:200px;height:36px;display:block;margin:0 auto">
      ${rects.join('')}
    </svg><p style="font-size:9px;color:#666;margin:2px 0 0;text-align:center">${order.code}</p>`;
  })();

  const { subtotal, shippingFee, discount, grandTotal } = calcInvoiceTotals(
    {
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount,
      fromBooking: order.fromBooking,
    },
    settings,
  );

  // Ship đã hiện trong items → totals chỉ cần Giảm giá (nếu có) + Tổng cộng
  const showDiscount = settings.invoiceShowDebt && discount > 0;

  const itemsHtml = order.items.map((it, idx) => {
    const lineTotal = it.unitPrice * it.quantity;
    const sl = it.weight ? `${it.quantity} (${it.weight}kg)` : `${it.quantity}`;
    return `<tr>
      <td style="border:1px solid #bbb;padding:3px 5px">${idx + 1}. ${it.name}</td>
      <td style="border:1px solid #bbb;padding:3px 5px;text-align:center;white-space:nowrap">${sl}</td>
      <td style="border:1px solid #bbb;padding:3px 5px;text-align:right;white-space:nowrap">${lineTotal.toLocaleString('vi-VN')}</td>
    </tr>`;
  }).join('') + (order.fromBooking && shippingFee > 0 ? `
    <tr style="background:#f0fdf4">
      <td style="border:1px solid #bbb;padding:3px 5px;font-weight:600;color:#15803d">🚚 Phí giao hàng</td>
      <td style="border:1px solid #bbb;padding:3px 5px;text-align:center">1</td>
      <td style="border:1px solid #bbb;padding:3px 5px;text-align:right;font-weight:600;color:#15803d">${shippingFee.toLocaleString('vi-VN')}đ</td>
    </tr>` : '');

  const date = new Date(order.createdAt);
  const dateStr = `${date.getDate().toString().padStart(2,'0')}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;

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
      width: 302px;
      margin: 0 auto;
    }
    @media print {
      @page { margin: 0; size: 80mm auto; }
      body { width: 80mm; margin: 0; }
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
  <div style="padding: 10px 10px 4px; text-align: center;">
    ${settings.invoiceShowLogo && settings.logo ? `<img src="${settings.logo}" style="height:40px;margin-bottom:4px;"/>` : ''}
    ${settings.invoiceShowShopName ? `<p style="font-weight:900;font-size:${base+4}px;text-transform:uppercase;letter-spacing:0.5px">${settings.shopName || 'TIỆM GIẶT'}</p>` : ''}
    ${settings.invoiceShowPhone && settings.phone ? `<p style="font-weight:600">${settings.phone}</p>` : ''}
    ${settings.invoiceShowAddress && settings.address ? `<p style="font-size:${sm}px;color:#555">Địa chỉ: ${settings.address}</p>` : ''}
    ${settings.invoiceShowWebsite && settings.website ? `<p style="font-size:${sm}px;color:#777">${settings.website}</p>` : ''}
  </div>

  <hr class="divider"/>

  <div style="padding: 4px 10px; text-align: center;">
    <p style="font-weight:700">HÓA ĐƠN</p>
    <p style="font-size:${sm}px;color:#555">${order.code} · ${dateStr}</p>
    ${deliveryBookingTagHtml(order, base, sm)}
    ${settings.invoiceShowBarcode ? barsHtml : ''}
  </div>

  <hr class="divider"/>

  <div style="padding: 4px 10px 6px;">
    <p style="font-size:${sm}px;color:#888">Khách:</p>
    <p style="font-size:${customerFs}px;font-weight:900;text-align:center;line-height:1.2;word-break:break-word">${order.customer?.name ?? '—'}</p>
    ${order.customer?.phone ? `<p style="font-size:${sm}px;color:#666;text-align:center">${order.customer.phone}</p>` : ''}
  </div>

  <div style="padding: 0 8px 6px;">
    <table>
      <thead>
        <tr>
          <th style="text-align:left">Sản phẩm</th>
          <th style="text-align:center;white-space:nowrap">SL</th>
          <th style="text-align:right;white-space:nowrap">T.Tiền</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
  </div>

  <hr class="divider"/>

  <div style="padding: 2px 10px 4px;">
    ${showDiscount ? `
    <div class="total-row" style="font-size:${sm}px;color:#555">
      <span>Tạm tính</span><span>${(subtotal + shippingFee).toLocaleString('vi-VN')}đ</span>
    </div>
    <div class="total-row" style="font-size:${sm}px;color:#555">
      <span>Giảm giá</span><span>- ${discount.toLocaleString('vi-VN')}đ</span>
    </div>` : ''}
    <div class="total-row bold" style="font-size:${base + 1}px">
      <span>Tổng cộng</span><span>${grandTotal.toLocaleString('vi-VN')}đ</span>
    </div>
  </div>

  ${settings.invoiceShowQR && qrDataUrl ? `
  <div style="text-align:center;padding:6px 0">
    <img src="${qrDataUrl}" style="width:70px;height:70px"/>
    <p style="font-size:${sm}px;color:#aaa">Quét để xem đơn hàng</p>
  </div>` : ''}

  <hr class="divider"/>
  <div style="text-align:center;padding:4px 10px 10px;font-size:${sm}px;color:#888">
    ${settings.openingHours ? `<p>Thời gian mở cửa: ${settings.openingHours}</p>` : ''}
    <p style="margin-top:2px">Cảm ơn quý khách!</p>
  </div>
</body>
</html>`;
}

// ─── Silent-print via popup ───────────────────────────────────────────────────
function printReceipt(html: string) {
  const popup = window.open('', '_blank', 'width=360,height=600,scrollbars=no,toolbar=no,menubar=no');
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

  // onload fires when images (logo/QR) finish loading
  popup.onload = doPrint;
  // Fallback for documents with no external resources (load fires synchronously before onload is set)
  setTimeout(doPrint, 600);
}

// ─── Inline receipt preview (fluid, fills container) ─────────────────────────
function InvoicePreviewPanel({
  order,
  settings,
  qrDataUrl,
}: {
  order: OrderData & { code: string };
  settings: ShopSettings;
  qrDataUrl?: string;
}) {
  const base = settings.invoiceFontSize ?? 13;
  const customerFs = settings.customerNameFontSize ?? 22;
  const sm = Math.max(base - 2, 9);

  const date = new Date(order.createdAt);
  const dateStr = `${date.getDate().toString().padStart(2,'0')}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;

  const { subtotal, shippingFee, discount, grandTotal } = calcInvoiceTotals(
    {
      totalAmount: Number(order.totalAmount),
      discountAmount: order.discountAmount,
      fromBooking: order.fromBooking,
    },
    settings,
  );
  // Ship đã hiện trong items → totals chỉ cần Giảm giá (nếu có) + Tổng cộng
  const showDiscount = settings.invoiceShowDebt && discount > 0;

  return (
    <div style={{ fontFamily: 'monospace', fontSize: base, color: '#000', width: '100%', lineHeight: 1.4 }}>
        {/* Header */}
        <div style={{ paddingBottom: 4, textAlign: 'center' }}>
            {settings.invoiceShowLogo && settings.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logo} alt="logo" style={{ height: 40, marginBottom: 4 }} />
            )}
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
            {order.fromBooking && (
              <div
                style={{
                  margin: '6px 10px',
                  padding: 8,
                  border: '2px solid #000',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontWeight: 900, fontSize: base + 3, letterSpacing: 1 }}>GIAO NHẬN</p>
                <p style={{ fontSize: sm, marginTop: 2 }}>Đơn đặt qua mã QR — shipper đi giao</p>
                {order.booking?.code && (
                  <p style={{ fontSize: sm, color: '#444', marginTop: 2, fontFamily: 'monospace' }}>
                    {order.booking.code}
                  </p>
                )}
                {order.pickupAt && (
                  <p style={{ fontSize: sm, marginTop: 2 }}>Hẹn lấy: {formatDateTime(order.pickupAt)}</p>
                )}
              </div>
            )}
            {settings.invoiceShowBarcode && <BarcodeGraphic code={order.code} />}
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed #aaa', margin: '4px 8px' }} />

          {/* Customer */}
          <div style={{ padding: '4px 10px 6px' }}>
            <p style={{ fontSize: sm, color: '#888' }}>Khách:</p>
            <p style={{ fontSize: customerFs, fontWeight: 900, textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word' }}>
              {order.customer?.name ?? '—'}
            </p>
            {order.customer?.phone && (
              <p style={{ fontSize: sm, color: '#666', textAlign: 'center' }}>{order.customer.phone}</p>
            )}
          </div>

          {/* Items table */}
          <div style={{ padding: '0 8px 6px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: sm }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ border: '1px solid #bbb', padding: '3px 5px', textAlign: 'left' }}>Sản phẩm</th>
                  <th style={{ border: '1px solid #bbb', padding: '3px 5px', textAlign: 'center', whiteSpace: 'nowrap' }}>SL</th>
                  <th style={{ border: '1px solid #bbb', padding: '3px 5px', textAlign: 'right', whiteSpace: 'nowrap' }}>T.Tiền</th>
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
                      {(it.unitPrice * it.quantity).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))}
                {/* Đơn booking: thêm dòng phí giao hàng vào bảng items */}
                {order.fromBooking && shippingFee > 0 && (
                  <tr style={{ background: '#f0fdf4' }}>
                    <td style={{ border: '1px solid #bbb', padding: '3px 5px', fontWeight: 600, color: '#15803d' }}>🚚 Phí giao hàng</td>
                    <td style={{ border: '1px solid #bbb', padding: '3px 5px', textAlign: 'center' }}>1</td>
                    <td style={{ border: '1px solid #bbb', padding: '3px 5px', textAlign: 'right', fontWeight: 600, color: '#15803d' }}>
                      {shippingFee.toLocaleString('vi-VN')}đ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed #aaa', margin: '4px 8px' }} />

          {/* Totals — ship đã trong items, chỉ cần Giảm giá (nếu có) + Tổng cộng */}
          <div style={{ padding: '2px 10px 4px' }}>
            {showDiscount && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: sm, color: '#555' }}>
                  <span>Tạm tính</span>
                  <span>{(subtotal + shippingFee).toLocaleString('vi-VN')}đ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: sm, color: '#555' }}>
                  <span>Giảm giá</span>
                  <span>- {discount.toLocaleString('vi-VN')}đ</span>
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: base + 1 }}>
              <span>Tổng cộng</span>
              <span>{grandTotal.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>

          {/* QR */}
          {settings.invoiceShowQR && qrDataUrl && (
            <div style={{ textAlign: 'center', padding: '6px 0' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR" style={{ width: 70, height: 70 }} />
              <p style={{ fontSize: sm, color: '#aaa' }}>Quét để xem đơn hàng</p>
            </div>
          )}

          {/* Footer */}
          <hr style={{ border: 'none', borderTop: '1px dashed #aaa', margin: '4px 8px' }} />
          <div style={{ textAlign: 'center', padding: '4px 10px 10px', fontSize: sm, color: '#888' }}>
            {settings.openingHours && <p>Thời gian mở cửa: {settings.openingHours}</p>}
            <p style={{ marginTop: 2 }}>Cảm ơn quý khách!</p>
          </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const qrRef = useRef<HTMLDivElement>(null);

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

  if (orderQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">Không tìm thấy đơn</p>
        <Button variant="ghost" asChild className="mt-3">
          <Link href="/orders"><ArrowLeft className="h-4 w-4" /> Quay lại</Link>
        </Button>
      </div>
    );
  }

  const order = orderQuery.data;
  const nextStatuses = NEXT_STATUS_TRANSITIONS[order.status];
  const settings = settingsQuery.data;

  function handlePrint() {
    if (!settings) { toast.error('Chưa tải được cài đặt hóa đơn'); return; }
    const html = buildReceiptHtml(order, settings, qrQuery.data?.dataUrl);
    printReceipt(html);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.code}
        description={`Tạo lúc ${formatDateTime(order.createdAt)}`}
        actions={
          <Button variant="ghost" asChild>
            <Link href="/orders"><ArrowLeft className="h-4 w-4" /> Tất cả đơn</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left: order info ── */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle>Thông tin đơn</CardTitle>
                <OrderStatusBadge status={order.status} />
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
                    <p className="font-semibold">{formatCurrency(it.subtotal ?? it.unitPrice * it.quantity)}</p>
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
              <div className="border-t bg-white px-3 py-3">
                {settingsQuery.isLoading || orderQuery.isLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : settings ? (
                  <InvoicePreviewPanel
                    order={order}
                    settings={settings}
                    qrDataUrl={qrQuery.data?.dataUrl}
                  />
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
            <CardHeader><CardTitle>Cập nhật trạng thái</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {nextStatuses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Đơn đã ở trạng thái cuối.</p>
              ) : (
                nextStatuses.map((s) => (
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
