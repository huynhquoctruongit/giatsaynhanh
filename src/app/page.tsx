import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  WashingMachine,
  Bike,
  Sparkles,
  PackageCheck,
  Smartphone,
  Wind,
  Shirt,
  Footprints,
  Clock,
  ShieldCheck,
  Wallet,
  QrCode,
  Phone,
  MapPin,
  ArrowRight,
  Star,
  CheckCircle2,
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────────
 * Thông tin tiệm — chỉnh ở đây (SĐT / địa chỉ / giờ mở cửa)
 * ────────────────────────────────────────────────────────────── */
const BRAND = 'Giặt Sấy Nhanh';
const PHONE = '0903 000 000'; // TODO: thay số điện thoại thật
const ADDRESS = 'Thủ Đức, TP. Hồ Chí Minh';
const HOURS = '7:00 – 21:00 mỗi ngày';

export const metadata: Metadata = {
  title: 'Giặt Sấy Nhanh — Giặt sấy giao nhận tận nhà ở Thủ Đức',
  description:
    'Đặt giặt sấy online, shipper lấy và giao tận nhà. Sạch thơm, đúng hẹn, giá theo kg minh bạch. Theo dõi đơn bằng mã QR.',
};

const BTN_PRIMARY =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 hover:shadow-primary/30';
const BTN_GHOST =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50';

const STEPS = [
  { icon: Smartphone, title: 'Đặt lịch online', desc: 'Nhập số điện thoại & địa chỉ, chọn giờ lấy đồ. 30 giây là xong.' },
  { icon: Bike, title: 'Lấy đồ tận nơi', desc: 'Shipper đến tận nhà nhận đồ — bạn không cần ra khỏi cửa.' },
  { icon: WashingMachine, title: 'Giặt sấy sạch thơm', desc: 'Giặt riêng từng khách, sấy khô, gấp gọn gàng, thơm lâu.' },
  { icon: PackageCheck, title: 'Giao lại đúng hẹn', desc: 'Đồ sạch được giao về tận nhà đúng khung giờ bạn chọn.' },
];

const SERVICES = [
  { icon: WashingMachine, title: 'Giặt sấy theo kg', desc: 'Quần áo hằng ngày — giặt, sấy, gấp. Tính theo cân, minh bạch.' },
  { icon: Shirt, title: 'Giặt hấp - ủi', desc: 'Áo sơ mi, áo dài, vest… phẳng phiu, sắc nét cho ngày quan trọng.' },
  { icon: Wind, title: 'Giặt khô', desc: 'Đồ cao cấp, chất liệu nhạy cảm được xử lý đúng cách, an toàn.' },
  { icon: Footprints, title: 'Giặt giày - chăn mền', desc: 'Đồ cồng kềnh, giày dép, chăn ga gối — sạch sâu, khô nhanh.' },
];

const FEATURES = [
  { icon: Clock, title: 'Đúng hẹn', desc: 'Lấy và giao theo khung giờ bạn chọn, không để bạn chờ.' },
  { icon: Wallet, title: 'Giá minh bạch', desc: 'Tính theo kg rõ ràng, báo giá trước, không phụ phí ẩn.' },
  { icon: QrCode, title: 'Theo dõi bằng QR', desc: 'Mỗi đơn một mã QR — quét là biết tình trạng đồ của bạn.' },
  { icon: ShieldCheck, title: 'Giặt riêng từng khách', desc: 'Đồ của bạn giặt riêng, không lẫn — sạch và an tâm.' },
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
            <a href="#how" className="transition hover:text-slate-900">Cách hoạt động</a>
            <a href="#services" className="transition hover:text-slate-900">Dịch vụ</a>
            <a href="#why" className="transition hover:text-slate-900">Vì sao chọn</a>
            <a href="#contact" className="transition hover:text-slate-900">Liên hệ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900 sm:inline-flex"
            >
              Đăng nhập
            </Link>
            <Link
              href="/dat-don"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Đặt giặt
              <ArrowRight className="h-4 w-4" />
            </Link>
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
              Giặt sấy · Giao nhận tận nhà
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl">
              Giặt sấy giao tận nhà,
              <br />
              <span className="text-primary">sạch thơm – đúng hẹn</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-slate-600">
              Bạn không cần ra khỏi nhà. Đặt lịch, shipper lấy đồ, giặt sấy gấp gọn
              rồi giao lại tận cửa. Tính tiền theo kg minh bạch.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/dat-don" className={BTN_PRIMARY}>
                Đặt giặt ngay
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a href={`tel:${PHONE.replace(/\s/g, '')}`} className={BTN_GHOST}>
                <Phone className="h-5 w-5" />
                Gọi đặt: {PHONE}
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Lấy & giao tận nơi
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Giao trong ngày
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Không cần đăng nhập
              </span>
            </div>
          </div>

          {/* Ảnh tiệm + thẻ nổi */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-slate-900/5">
              <Image
                src="/og-cover.jpg"
                alt={`Tiệm ${BRAND}`}
                fill
                priority
                sizes="(max-width: 768px) 90vw, 420px"
                className="object-cover"
              />
            </div>
            <div className="absolute -left-4 top-8 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-slate-900/5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bike className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold leading-none">Giao trong ngày</p>
                <p className="mt-1 text-xs text-slate-500">Tận nhà bạn</p>
              </div>
            </div>
            <div className="absolute -right-3 bottom-10 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-slate-900/5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-500">
                <Star className="h-5 w-5 fill-amber-400" />
              </span>
              <div>
                <p className="text-sm font-bold leading-none">Sạch thơm</p>
                <p className="mt-1 text-xs text-slate-500">Gấp gọn gàng</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Stats strip ───────── */}
      <section className="border-y border-slate-100 bg-slate-50/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 md:grid-cols-4">
          {[
            { value: '500+', label: 'Khách hàng tin dùng' },
            { value: 'Trong ngày', label: 'Giao nhận nhanh' },
            { value: 'Theo kg', label: 'Giá minh bạch' },
            { value: 'Thủ Đức', label: 'Phục vụ khu vực' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-extrabold text-primary md:text-3xl">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Giặt đồ chỉ với 4 bước</h2>
          <p className="mt-3 text-slate-600">Đơn giản, nhanh gọn — bạn chỉ việc chờ đồ sạch về tới cửa.</p>
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

      {/* ───────── Services ───────── */}
      <section id="services" className="bg-slate-50/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Dịch vụ của tiệm</h2>
            <p className="mt-3 text-slate-600">Từ quần áo hằng ngày đến đồ cần chăm sóc đặc biệt.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((sv) => {
              const Icon = sv.icon;
              return (
                <div key={sv.title} className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{sv.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{sv.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── Why us ───────── */}
      <section id="why" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Vì sao chọn {BRAND}?</h2>
          <p className="mt-3 text-slate-600">Tiện lợi, minh bạch và đáng tin — để bạn yên tâm giao đồ.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold">{f.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ───────── CTA band ───────── */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground shadow-xl">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-white/10" />
          <h2 className="relative text-3xl font-extrabold tracking-tight md:text-4xl">
            Sẵn sàng giặt sấy mà không cần ra khỏi nhà?
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-primary-foreground/90">
            Đặt lịch trong 30 giây — shipper sẽ tới lấy đồ và giao lại sạch thơm tận cửa.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/dat-don"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-base font-semibold text-primary shadow-lg transition hover:bg-white/90"
            >
              Đặt giặt ngay
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href={`tel:${PHONE.replace(/\s/g, '')}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-7 text-base font-semibold text-white transition hover:bg-white/10"
            >
              <Phone className="h-5 w-5" />
              {PHONE}
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
              Tiệm {BRAND} — chất lượng <strong className="font-bold text-slate-900">NHÌ</strong> Thủ Đức,
              còn ở đâu <strong className="font-bold text-slate-900">NHẤT</strong> thì sốp hông biết 😄
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-slate-400">Liên hệ</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <a href={`tel:${PHONE.replace(/\s/g, '')}`} className="hover:text-slate-900">{PHONE}</a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> {ADDRESS}
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> {HOURS}
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wide text-slate-400">Bắt đầu</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>
                <Link href="/dat-don" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
                  Đặt giặt ngay <ArrowRight className="h-4 w-4" />
                </Link>
              </li>
              <li><a href="#how" className="hover:text-slate-900">Cách hoạt động</a></li>
              <li><a href="#services" className="hover:text-slate-900">Dịch vụ</a></li>
              <li><Link href="/admin" className="hover:text-slate-900">Đăng nhập quản lý</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100">
          <div className="mx-auto max-w-6xl px-5 py-5 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} {BRAND}. Giặt sấy giao nhận tận nhà tại {ADDRESS}.
          </div>
        </div>
      </footer>
    </div>
  );
}
