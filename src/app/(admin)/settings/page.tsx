'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { settingsApi, type ShopSettings } from '@/services/api/settings.api';
import { extractError } from '@/services/api/client';

type Tab = 'shop' | 'invoice' | 'features';

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <Label className="cursor-pointer">{label}</Label>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

// ─── Font slider ──────────────────────────────────────────────────────────────
function FontSlider({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="rounded bg-muted px-2 py-0.5 font-mono text-sm font-medium">{value}px</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Nhỏ ({min}px)</span>
        <span>Lớn ({max}px)</span>
      </div>
    </div>
  );
}

// ─── Decorative barcode SVG ───────────────────────────────────────────────────
function BarcodeGraphic() {
  const bars = [3,1,2,1,3,2,1,2,1,3,1,2,3,1,1,2,3,1,2,1,1,3,2,1,3,2,1,1,2,3,1];
  let x = 0;
  const rects: { x: number; w: number }[] = [];
  bars.forEach((w, i) => {
    if (i % 2 === 0) rects.push({ x, w });
    x += w;
  });
  const totalW = x;
  return (
    <svg viewBox={`0 0 ${totalW} 40`} className="w-full" style={{ maxWidth: 220, height: 40 }}>
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={0} width={r.w} height={40} fill="black" />
      ))}
    </svg>
  );
}

// ─── Receipt preview (matches real 80mm thermal receipt) ─────────────────────
interface PreviewProps {
  shopName: string; phone: string; address: string; website: string;
  fontSize: number; customerNameFontSize: number;
  showLogo: boolean; showShopName: boolean; showPhone: boolean;
  showAddress: boolean; showWebsite: boolean; showBarcode: boolean;
  showQr: boolean; showDebt: boolean; openingHours: string;
}

function ReceiptPreview(p: PreviewProps) {
  const base = p.fontSize;
  const sm = Math.max(base - 2, 9);

  return (
    /* 80mm paper: ~302px at 96dpi */
    <div
      className="mx-auto bg-white text-black shadow-md"
      style={{ width: 302, fontFamily: 'monospace', fontSize: base, lineHeight: 1.4 }}
    >
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-2 text-center space-y-0.5">
        {p.showLogo && (
          <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-400 border">Logo</div>
        )}
        {p.showShopName && (
          <p className="font-extrabold uppercase leading-tight tracking-wide" style={{ fontSize: base + 4 }}>
            {p.shopName || 'GIẶT SẤY NHANH'}
          </p>
        )}
        {p.showPhone && p.phone && <p className="font-semibold">{p.phone}</p>}
        {p.showAddress && p.address && (
          <p style={{ fontSize: sm }} className="text-gray-700">
            Địa chỉ: {p.address}
          </p>
        )}
        {p.showWebsite && p.website && (
          <p style={{ fontSize: sm }} className="text-gray-500">{p.website}</p>
        )}
      </div>

      <div className="border-t border-gray-300 mx-3" />

      {/* ── Invoice code ── */}
      <div className="px-4 py-2 text-center space-y-1">
        <p className="font-bold" style={{ fontSize: base }}>HÓA ĐƠN</p>
        <p style={{ fontSize: sm }}>HD15040017 · 15/04/2026 13:48</p>
        {p.showBarcode && (
          <div className="flex justify-center pt-1">
            <BarcodeGraphic />
          </div>
        )}
      </div>
      <div className="border-t border-gray-300 mx-3" />

      {/* ── Customer name (very prominent) ── */}
      <div className="px-4 py-3">
        <p style={{ fontSize: sm }} className="text-gray-500 mb-1">Khách:</p>
        <p
          className="font-extrabold text-center leading-tight break-words"
          style={{ fontSize: p.customerNameFontSize }}
        >
          Dragon Prime Gym
        </p>
      </div>

      {/* ── Items table ── */}
      <div className="px-3 pb-2">
        <table className="w-full border-collapse border border-gray-400" style={{ fontSize: sm }}>
          <thead>
            <tr className="border-b border-gray-400 bg-gray-50">
              <th className="border-r border-gray-400 px-1.5 py-1 text-left font-semibold">Sản phẩm</th>
              <th className="border-r border-gray-400 px-1.5 py-1 text-center font-semibold whitespace-nowrap">SL</th>
              <th className="border-r border-gray-400 px-1.5 py-1 text-right font-semibold whitespace-nowrap">Đơn giá</th>
              <th className="px-1.5 py-1 text-right font-semibold whitespace-nowrap">T.Tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-r border-gray-400 px-1.5 py-1">1. Khăn Spa / Gym / Khách sạn</td>
              <td className="border-r border-gray-400 px-1.5 py-1 text-center whitespace-nowrap">30.8 kg</td>
              <td className="border-r border-gray-400 px-1.5 py-1 text-right whitespace-nowrap">15,000</td>
              <td className="px-1.5 py-1 text-right whitespace-nowrap">462,000</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Totals ── */}
      <div className="px-4 pb-2 space-y-1">
        <div className="flex justify-between font-bold" style={{ fontSize: base }}>
          <span>Tổng cộng</span>
          <span>462,000</span>
        </div>
        {p.showDebt && (
          <>
            <div className="flex justify-between text-gray-600" style={{ fontSize: sm }}>
              <span>Nợ cũ</span>
              <span>0 đ</span>
            </div>
            <div className="flex justify-between font-bold" style={{ fontSize: base }}>
              <span>Còn phải thu</span>
              <span>462,000 đ</span>
            </div>
          </>
        )}
      </div>

      {/* ── QR ── */}
      {p.showQr && (
        <div className="flex flex-col items-center py-2 gap-1">
          <div className="h-16 w-16 border border-gray-300 bg-gray-100 flex items-center justify-center text-xs text-gray-400 rounded">
            QR
          </div>
          <p style={{ fontSize: sm }} className="text-gray-400">Quét để xem đơn hàng</p>
        </div>
      )}

      {/* ── Footer ── */}
      {p.openingHours && (
        <div className="border-t border-gray-300 mx-3 mt-1" />
      )}
      <div className="px-4 pt-1 pb-4 text-center" style={{ fontSize: sm }}>
        {p.openingHours && (
          <p className="text-gray-500">Thời gian mở cửa: {p.openingHours}</p>
        )}
        <p className="mt-1 text-gray-400">Cảm ơn quý khách!</p>
      </div>
    </div>
  );
}

// ─── Label preview ────────────────────────────────────────────────────────────
function LabelPreview({ template, fontSize, shopName }: { template: string; fontSize: number; shopName: string }) {
  const rendered = (template || '{{shopName}}\nMã: {{code}}\nKH: {{customerName}}\nSĐT: {{phone}}')
    .replace(/\{\{shopName\}\}/g, shopName || 'Tiệm Giặt ABC')
    .replace(/\{\{code\}\}/g, 'LD-20240516-00001')
    .replace(/\{\{customerName\}\}/g, 'Nguyễn Văn A')
    .replace(/\{\{phone\}\}/g, '0901234567')
    .replace(/\{\{items\}\}/g, 'Giặt sấy thường x2');
  return (
    <div
      className="bg-white border-2 border-dashed border-gray-400 rounded p-3 text-black whitespace-pre-line leading-snug shadow-inner"
      style={{ fontSize, fontFamily: 'monospace' }}
    >
      {rendered}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('shop');

  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.get });

  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [logo, setLogo] = useState('');

  const [invoiceFontSize, setInvoiceFontSize] = useState(13);
  const [customerNameFontSize, setCustomerNameFontSize] = useState(22);
  const [invoiceShowLogo, setInvoiceShowLogo] = useState(false);
  const [invoiceShowShopName, setInvoiceShowShopName] = useState(true);
  const [invoiceShowPhone, setInvoiceShowPhone] = useState(true);
  const [invoiceShowAddress, setInvoiceShowAddress] = useState(true);
  const [invoiceShowWebsite, setInvoiceShowWebsite] = useState(false);
  const [invoiceShowBarcode, setInvoiceShowBarcode] = useState(true);
  const [invoiceShowQR, setInvoiceShowQR] = useState(true);
  const [invoiceShowDebt, setInvoiceShowDebt] = useState(true);
  const [openingHours, setOpeningHours] = useState('');
  const [labelTemplate, setLabelTemplate] = useState('');
  const [labelFontSize, setLabelFontSize] = useState(12);

  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [loyaltyPointsRate, setLoyaltyPointsRate] = useState('');
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState('');
  const [allowNoShiftOrder, setAllowNoShiftOrder] = useState(true);

  useEffect(() => {
    if (!data) return;
    const d = data as any;
    setShopName(d.shopName ?? '');
    setPhone(d.phone ?? '');
    setAddress(d.address ?? '');
    setWebsite(d.website ?? '');
    setTaxCode(d.taxCode ?? '');
    setLogo(d.logo ?? '');
    setInvoiceFontSize(d.invoiceFontSize ?? 13);
    setCustomerNameFontSize(d.customerNameFontSize ?? 22);
    setInvoiceShowLogo(d.invoiceShowLogo ?? false);
    setInvoiceShowShopName(d.invoiceShowShopName ?? true);
    setInvoiceShowPhone(d.invoiceShowPhone ?? true);
    setInvoiceShowAddress(d.invoiceShowAddress ?? true);
    setInvoiceShowWebsite(d.invoiceShowWebsite ?? false);
    setInvoiceShowBarcode(d.invoiceShowBarcode ?? true);
    setInvoiceShowQR(d.invoiceShowQR ?? true);
    setInvoiceShowDebt(d.invoiceShowDebt ?? true);
    setOpeningHours(d.openingHours ?? '');
    setLabelTemplate(d.labelTemplate ?? '');
    setLabelFontSize(d.labelFontSize ?? 12);
    setLoyaltyEnabled(d.loyaltyEnabled ?? false);
    setLoyaltyPointsRate(d.loyaltyPointsRate?.toString() ?? '');
    setDeliveryEnabled(d.deliveryEnabled ?? false);
    setDeliveryFee(d.deliveryFee?.toString() ?? '');
    setAllowNoShiftOrder(d.allowNoShiftOrder ?? true);
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<ShopSettings>) => settingsApi.update(payload),
    onSuccess: () => { toast.success('Đã lưu cài đặt'); queryClient.invalidateQueries({ queryKey: ['settings'] }); },
    onError: (err) => toast.error(extractError(err).message),
  });

  function saveShopInfo() {
    updateMutation.mutate({ shopName, phone: phone || null, address: address || null, website: website || null, taxCode: taxCode || null, logo: logo || null });
  }

  function saveInvoice() {
    updateMutation.mutate({
      invoiceFontSize, customerNameFontSize,
      invoiceShowLogo, invoiceShowShopName, invoiceShowPhone,
      invoiceShowAddress, invoiceShowWebsite, invoiceShowBarcode,
      invoiceShowQR, invoiceShowDebt,
      openingHours: openingHours || null,
      labelTemplate: labelTemplate || null, labelFontSize,
    } as any);
  }

  function saveFeatures() {
    updateMutation.mutate({
      loyaltyEnabled, loyaltyPointsRate: loyaltyPointsRate ? Number(loyaltyPointsRate) : null,
      deliveryEnabled, deliveryFee: deliveryFee ? Number(deliveryFee) : null,
      allowNoShiftOrder,
    });
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'shop', label: 'Thông tin cửa hàng' },
    { key: 'invoice', label: 'Hóa đơn & Tem nhãn' },
    { key: 'features', label: 'Tính năng bổ sung' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cài đặt" />
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Cài đặt" description="Cấu hình thông tin và tính năng cửa hàng" />

      <div className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${tab === t.key ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Shop Info ── */}
      {tab === 'shop' && (
        <Card>
          <CardHeader><CardTitle>Thông tin cửa hàng</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tên cửa hàng *</Label>
                <Input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Giặt Sấy ABC" />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901234567" />
              </div>
              <div className="space-y-2">
                <Label>Địa chỉ</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="02, Đường số 12, Tăng Nhơn Phú, Thủ Đức" />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://giatsayabc.com" />
              </div>
              <div className="space-y-2">
                <Label>Mã số thuế</Label>
                <Input value={taxCode} onChange={(e) => setTaxCode(e.target.value)} placeholder="0123456789" />
              </div>
              <div className="space-y-2">
                <Label>Logo (URL hoặc base64)</Label>
                <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={saveShopInfo} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4" />{updateMutation.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Invoice & Label ── */}
      {tab === 'invoice' && (
        <div className="space-y-6">
          {/* Invoice controls + live receipt preview */}
          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            {/* Left: all invoice controls */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Cỡ chữ hóa đơn</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <FontSlider label="Chữ thường (nội dung)" value={invoiceFontSize} onChange={setInvoiceFontSize} min={10} max={18} />
                  <FontSlider label="Tên khách hàng (nổi bật)" value={customerNameFontSize} onChange={setCustomerNameFontSize} min={14} max={36} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Hiển thị trên hóa đơn</CardTitle></CardHeader>
                <CardContent className="divide-y">
                  <Toggle checked={invoiceShowLogo} onChange={setInvoiceShowLogo} label="Hiện logo" />
                  <Toggle checked={invoiceShowShopName} onChange={setInvoiceShowShopName} label="Hiện tên cửa hàng" />
                  <Toggle checked={invoiceShowPhone} onChange={setInvoiceShowPhone} label="Hiện số điện thoại" />
                  <Toggle checked={invoiceShowAddress} onChange={setInvoiceShowAddress} label="Hiện địa chỉ" />
                  <Toggle checked={invoiceShowWebsite} onChange={setInvoiceShowWebsite} label="Hiện website" />
                  <Toggle checked={invoiceShowBarcode} onChange={setInvoiceShowBarcode} label="Hiện mã vạch (barcode)" />
                  <Toggle checked={invoiceShowQR} onChange={setInvoiceShowQR} label="Hiện QR code trên hoá đơn in" />
                  <Toggle checked={invoiceShowDebt} onChange={setInvoiceShowDebt} label="Hiện nợ cũ & còn phải thu" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Footer hóa đơn</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Thời gian mở cửa</Label>
                    <Input value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} placeholder="6h30 - 22h00" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: live receipt preview */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Xem trước hóa đơn (80mm)</p>
              <div className="rounded-xl border bg-zinc-100 p-4 overflow-auto">
                <ReceiptPreview
                  shopName={shopName} phone={phone} address={address} website={website}
                  fontSize={invoiceFontSize} customerNameFontSize={customerNameFontSize}
                  showLogo={invoiceShowLogo} showShopName={invoiceShowShopName}
                  showPhone={invoiceShowPhone} showAddress={invoiceShowAddress}
                  showWebsite={invoiceShowWebsite} showBarcode={invoiceShowBarcode}
                  showQr={invoiceShowQR} showDebt={invoiceShowDebt}
                  openingHours={openingHours}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">Giả lập khổ giấy 80mm</p>
            </div>
          </div>

          {/* Label section */}
          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <Card>
              <CardHeader><CardTitle>Mẫu tem nhãn</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nội dung tem nhãn</Label>
                  <Textarea
                    rows={6}
                    value={labelTemplate}
                    onChange={(e) => setLabelTemplate(e.target.value)}
                    placeholder={'{{shopName}}\nMã: {{code}}\nKH: {{customerName}}\nSĐT: {{phone}}\nDV: {{items}}'}
                    className="font-mono text-sm"
                  />
                  <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                    Biến:
                    {['{{shopName}}', '{{code}}', '{{customerName}}', '{{phone}}', '{{items}}'].map((v) => (
                      <code key={v} className="rounded bg-muted px-1">{v}</code>
                    ))}
                  </div>
                </div>
                <FontSlider label="Cỡ chữ tem nhãn" value={labelFontSize} onChange={setLabelFontSize} min={10} max={20} />
              </CardContent>
            </Card>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Xem trước tem nhãn</p>
              <div className="rounded-xl border bg-zinc-100 p-4">
                <div className="w-56">
                  <LabelPreview template={labelTemplate} fontSize={labelFontSize} shopName={shopName} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Kích thước thực phụ thuộc máy in</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveInvoice} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4" />{updateMutation.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Features ── */}
      {tab === 'features' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Tích điểm khách hàng</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Toggle checked={loyaltyEnabled} onChange={setLoyaltyEnabled} label="Bật tích điểm" />
              {loyaltyEnabled && (
                <div className="space-y-2">
                  <Label>Tỉ lệ tích điểm (VND / 1 điểm)</Label>
                  <Input type="number" value={loyaltyPointsRate} onChange={(e) => setLoyaltyPointsRate(e.target.value)} placeholder="1000" min={0} />
                  <p className="text-xs text-muted-foreground">Ví dụ: 1000 → mỗi 1,000đ tích được 1 điểm</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Dịch vụ giao nhận</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Toggle checked={deliveryEnabled} onChange={setDeliveryEnabled} label="Bật dịch vụ giao nhận" />
              {deliveryEnabled && (
                <div className="space-y-2">
                  <Label>Phí giao hàng mặc định (VND)</Label>
                  <Input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} placeholder="20000" min={0} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Đơn hàng</CardTitle></CardHeader>
            <CardContent>
              <Toggle checked={allowNoShiftOrder} onChange={setAllowNoShiftOrder} label="Cho phép tạo đơn khi chưa vào ca" />
              <p className="mt-1 text-xs text-muted-foreground">Nếu tắt, nhân viên phải check-in ca trước khi tạo đơn</p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveFeatures} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4" />{updateMutation.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
