import type { Metadata } from 'next';
import Link from 'next/link';
import {
  WashingMachine,
  Bike,
  Sparkles,
  Smartphone,
  QrCode,
  Wallet,
  ShieldCheck,
  Boxes,
  Users,
  LineChart,
  Printer,
  Building2,
  ArrowRight,
  Phone,
  MapPin,
  MessageCircle,
  CheckCircle2,
  LayoutDashboard,
  Bell,
} from 'lucide-react';
import { PricingSection } from '@/components/common/pricing-section';
import { CONTACT } from '@/helpers/constants/contact';

export const metadata: Metadata = {
  title: 'Giặt Sấy Nhanh — Phần mềm quản lý tiệm giặt ủi',
  description:
    'Giải pháp quản lý tiệm giặt ủi toàn diện: khách đặt lịch qua quét mã QR, nhân viên xử lý đơn trên app, thanh toán VietQR tự động, giao nhận tận nhà.',
};

const BRAND = 'Giặt Sấy Nhanh';

const BTN_PRIMARY =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 hover:shadow-primary/30';
const BTN_GHOST =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50';

const STEPS = [
  {
    icon: QrCode,
    title: 'Khách quét mã QR',
    desc: 'Khách quét mã dán tại cửa tiệm (hoặc trên hoá đơn) để tự đặt lịch giao nhận, không cần cài app.',
  },
  {
    icon: Smartphone,
    title: 'Nhân viên xử lý trên app',
    desc: 'Đơn mới báo về app ngay lập tức — nhân viên nhận, cập nhật trạng thái, in tem nhãn tại chỗ.',
  },
  {
    icon: Wallet,
    title: 'Thanh toán VietQR tự động',
    desc: 'Hoá đơn tự tạo mã QR chuyển khoản đúng số tiền — khách quét là chuyển, không cần nhập tay.',
  },
  {
    icon: Bike,
    title: 'Giao nhận tận nhà',
    desc: 'Theo dõi đơn xuyên suốt tới khi giao lại tận cửa — khách xem được trạng thái mọi lúc.',
  },
];

const FEATURES = [
  { icon: QrCode, title: 'Đặt lịch qua quét mã QR', desc: 'Mỗi tiệm một mã QR riêng, bật/tắt được — khách tự đặt lịch giao nhận không cần gọi điện.' },
  { icon: Printer, title: 'In hoá đơn & tem nhãn', desc: 'Kết nối máy in Bluetooth/Wifi/Sunmi, in hoá đơn và tem nhãn ngay khi nhận đồ.' },
  { icon: Wallet, title: 'Thanh toán VietQR', desc: 'Sinh mã QR chuyển khoản đúng số tiền từng đơn, đối soát nhanh, không nhầm lẫn.' },
  { icon: Boxes, title: 'Quản lý kho & thu chi', desc: 'Theo dõi nguyên vật liệu, chi phí vận hành, công nợ khách hàng — nhàng minh bạch.' },
  { icon: Users, title: 'Quản lý nhân viên & ca làm', desc: 'Phân quyền theo vai trò, chấm công theo ca, kiểm soát ai tạo/sửa đơn nào.' },
  { icon: LineChart, title: 'Báo cáo & thống kê', desc: 'Doanh thu, đơn hàng, hiệu suất nhân viên theo ngày/tháng — ra quyết định nhanh hơn.' },
  { icon: ShieldCheck, title: 'Tích điểm khách hàng', desc: 'Giữ chân khách quen bằng chương trình tích điểm cấu hình theo từng tiệm.' },
  { icon: Building2, title: 'Quản lý đa chi nhánh', desc: 'Chuỗi nhiều tiệm dùng chung một tài khoản, tách biệt dữ liệu từng chi nhánh.' },
];

const WHY = [
  { title: 'Chuyên nghiệp hoá dịch vụ', desc: 'Khách tự đặt lịch, tự theo dõi đơn qua QR — trải nghiệm như thương hiệu lớn.' },
  { title: 'Minh bạch dòng tiền', desc: 'Thu chi, công nợ, thanh toán VietQR đều có sổ sách rõ ràng, đối soát tức thì.' },
  { title: 'Tiết kiệm thời gian vận hành', desc: 'Bớt ghi chép tay, bớt sai sót — nhân viên chỉ cần thao tác trên app.' },
  { title: 'Dễ dùng, hỗ trợ nhanh', desc: 'Giao diện tối giản, không cần rành công nghệ; đội ngũ hỗ trợ đồng hành khi triển khai.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ───────── Header ───────── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <WashingMachine className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">{BRAND}</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-slate-900">Tính năng</a>
            <a href="#how" className="transition hover:text-slate-900">Cách hoạt động</a>
            <a href="#pricing" className="transition hover:text-slate-900">Bảng giá</a>
            <a href="#contact" className="transition hover:text-slate-900">Liên hệ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900 sm:inline-flex"
            >
              Đăng nhập
            </Link>
            <a
              href="#pricing"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Dùng thử miễn phí
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.06] via-white to-white" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              Phần mềm quản lý tiệm giặt ủi
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl">
              Quét mã đặt lịch,
              <br />
              <span className="text-primary">quản lý bằng app, giao tận nhà</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-slate-600">
              Giải pháp trọn gói cho tiệm giặt ủi: khách tự đặt lịch qua QR, nhân
              viên xử lý đơn trên app, thanh toán VietQR tự động — mọi thứ đồng bộ
              theo thời gian thực.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#pricing" className={BTN_PRIMARY}>
                Dùng thử miễn phí
                <ArrowRight className="h-5 w-5" />
              </a>
              <a href="#features" className={BTN_GHOST}>
                Xem tính năng
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Đặt lịch qua QR
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> App cho nhân viên
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Thanh toán VietQR
              </span>
            </div>
          </div>

          {/* Mockup minh hoạ app — không phải ảnh chụp thật */}
          <div className="relative mx-auto w-full max-w-sm py-6">
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl ring-1 ring-slate-900/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <LayoutDashboard className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-bold">Tổng quan hôm nay</span>
                </div>
                <Bell className="h-4 w-4 text-slate-400" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Doanh thu</p>
                  <p className="mt-1 text-lg font-extrabold text-slate-900">1.237.400đ</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Đơn mới</p>
                  <p className="mt-1 text-lg font-extrabold text-primary">12</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {[
                  { code: 'LD-20260928-L88GR', status: 'Sẵn sàng giao' },
                  { code: 'LD-20260928-RQZN3', status: 'Đang giặt' },
                ].map((o) => (
                  <div key={o.code} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-xs">
                    <span className="font-mono text-slate-500">{o.code}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">{o.status}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-900 p-3 text-white">
                <QrCode className="h-8 w-8" />
                <div>
                  <p className="text-xs font-semibold">QR đặt lịch tại cửa</p>
                  <p className="text-[11px] text-white/60">Khách quét → tự đặt đơn</p>
                </div>
              </div>
            </div>

            <div className="absolute -left-6 -top-2 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-slate-900/5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Smartphone className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold leading-none">Quản lý trên app</p>
                <p className="mt-1 text-xs text-slate-500">Mọi lúc, mọi nơi</p>
              </div>
            </div>
            <div className="absolute -right-6 -bottom-2 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-slate-900/5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-500">
                <Wallet className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold leading-none">VietQR tự động</p>
                <p className="mt-1 text-xs text-slate-500">Đúng số tiền</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Trust strip ───────── */}
      <section className="border-y border-slate-100 bg-slate-50/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 md:grid-cols-4">
          {[
            { value: 'Đa chi nhánh', label: 'Quản lý nhiều tiệm' },
            { value: 'Thời gian thực', label: 'Đồng bộ tức thì' },
            { value: 'Không giới hạn', label: 'Số lượng đơn hàng' },
            { value: 'Android POS', label: 'Sẵn sàng máy in nhiệt' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-extrabold text-primary md:text-2xl">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Vận hành chỉ với 4 bước</h2>
          <p className="mt-3 text-slate-600">Từ lúc khách đặt lịch tới khi giao lại tận nhà — tất cả đồng bộ trên một hệ thống.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md">
                <span className="absolute right-5 top-5 text-4xl font-black text-slate-100">{i + 1}</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ───────── Features ───────── */}
      <section id="features" className="bg-slate-50/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Tính năng đầy đủ cho một tiệm giặt ủi</h2>
            <p className="mt-3 text-slate-600">Từ đặt lịch, xử lý đơn tới thu chi và báo cáo — không cần thêm công cụ rời rạc.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-base font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── Pricing ───────── */}
      <PricingSection />

      {/* ───────── Why us ───────── */}
      <section id="why" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Vì sao chủ tiệm chọn {BRAND}?</h2>
          <p className="mt-3 text-slate-600">Xây riêng cho ngành giặt ủi — không phải phần mềm bán hàng lắp ghép chung chung.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((f) => (
            <div key={f.title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── CTA band ───────── */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground shadow-xl">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-white/10" />
          <h2 className="relative text-3xl font-extrabold tracking-tight md:text-4xl">
            Sẵn sàng số hoá tiệm giặt ủi của bạn?
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-primary-foreground/90">
            Chuyển từ sổ sách viết tay sang hệ thống quản lý hiện đại — khách tự đặt lịch, đội ngũ xử lý trên app.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#pricing"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-base font-semibold text-primary shadow-lg transition hover:bg-white/90"
            >
              Xem bảng giá
              <ArrowRight className="h-5 w-5" />
            </a>
            <a
              href={CONTACT.telUrl}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-7 text-base font-semibold text-white transition hover:bg-white/10"
            >
              <Phone className="h-5 w-5" />
              Gọi tư vấn {CONTACT.phoneDisplay}
            </a>
          </div>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer id="contact" className="border-t border-slate-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <WashingMachine className="h-5 w-5" />
              </span>
              <span className="text-lg font-extrabold tracking-tight">{BRAND}</span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-slate-600">
              Phần mềm quản lý tiệm giặt ủi: đặt lịch qua quét mã QR, xử lý đơn trên
              app, thanh toán VietQR tự động, giao nhận tận nhà.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-slate-400">Liên hệ tư vấn</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>
                <a href={CONTACT.telUrl} className="flex items-center gap-2 font-semibold text-slate-900 hover:text-primary">
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  {CONTACT.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={CONTACT.zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-primary"
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
                  Nhắn Zalo {CONTACT.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={CONTACT.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 hover:text-primary"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {CONTACT.address}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-slate-400">Bắt đầu</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>
                <a href="#pricing" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
                  Xem bảng giá <ArrowRight className="h-4 w-4" />
                </a>
              </li>
              <li><a href="#how" className="hover:text-slate-900">Cách hoạt động</a></li>
              <li><a href="#features" className="hover:text-slate-900">Tính năng</a></li>
              <li><Link href="/login" className="hover:text-slate-900">Đăng nhập quản lý</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100">
          <div className="mx-auto max-w-6xl px-5 py-5 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} {BRAND}. Phần mềm quản lý tiệm giặt ủi.
          </div>
        </div>
      </footer>
    </div>
  );
}
