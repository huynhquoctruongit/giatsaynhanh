import { Check, Crown, Sparkles } from 'lucide-react';
import { PLATFORM_API_BASE_URL } from '@/services/api/platform.api';
import { CONTACT } from '@/helpers/constants/contact';

interface Tier {
  name: string;
  period: string;
  description: string;
  popular?: boolean;
  /** Thẻ VIP: viền gradient vàng chuyển động */
  vip?: boolean;
  price: number;
  features: string[];
}

// Dự phòng khi không gọi được API — giá thật do platform admin chỉnh ở /platform/plans.
const FALLBACK_TIERS: Tier[] = [
  {
    name: 'Gói 6 tháng',
    period: '/6 tháng',
    description: 'Bắt đầu số hoá quy trình cho tiệm.',
    price: 990_000,
    features: [
      'Quản lý đơn hàng & khách hàng',
      'Tặng máy quét đơn',
    ],
  },
  {
    name: 'Gói 1 năm',
    period: '/năm',
    description: 'Đầy đủ tính năng đặt lịch & thanh toán.',
    popular: true,
    price: 2_490_000,
    features: [
      'Quản lý đơn hàng & khách hàng',
      'Đặt giao nhận qua quét mã QR',
      'Hiển thị mã QR chuyển khoản tự động theo số tiền trên đơn',
      'Hiển thị số tiền đã chuyển khoản mỗi ngày trên app',
      'Tặng máy quét đơn',
    ],
  },
  {
    name: 'Gói 3 năm',
    period: '/3 năm',
    description: 'Trọn gói lâu dài, tặng kèm máy POS.',
    price: 5_990_000,
    features: [
      'Tất cả lợi ích của gói 6 tháng & 1 năm',
      'Tặng máy POS bán hàng SUNMI T2',
    ],
  },
  {
    name: 'Gói Setup trọn đời',
    period: '/trọn đời',
    description: 'Setup mọi thứ để tiệm vận hành trơn tru ngay từ ngày đầu.',
    price: 0,
    features: [
      'Sử dụng phần mềm trọn đời, không cần gia hạn',
      'Tặng máy POS bán hàng SUNMI T2',
      'Tặng máy quét đơn',
      'Hướng dẫn vận hành tiệm giặt sấy cho tiệm mới mở',
    ],
  },
];

function formatVnd(v: number) {
  return v.toLocaleString('vi-VN') + 'đ';
}

// Số cột theo số gói đang bán → luôn trải đều, căn giữa (class viết đủ để Tailwind nhận).
const GRID_BY_COUNT: Record<number, string> = {
  1: 'mx-auto max-w-sm',
  2: 'mx-auto max-w-3xl md:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
  4: 'md:grid-cols-2 lg:grid-cols-4',
};

async function fetchTiers(): Promise<Tier[]> {
  try {
    const res = await fetch(`${PLATFORM_API_BASE_URL}/platform/public/plans`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return FALLBACK_TIERS;
    const json = (await res.json()) as { data?: Tier[] };
    // API trả mảng (kể cả rỗng khi đã xoá hết gói) → dùng đúng dữ liệu; chỉ dự phòng khi lỗi
    return Array.isArray(json.data) ? json.data : FALLBACK_TIERS;
  } catch {
    return FALLBACK_TIERS;
  }
}

export async function PricingSection() {
  const tiers = await fetchTiers();
  if (tiers.length === 0) return null;

  return (
    <section id="pricing" className="bg-slate-50/60 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Bảng giá</h2>
          <p className="mt-3 text-slate-600">Chọn gói theo thời hạn cam kết — cam kết càng dài, ưu đãi càng lớn.</p>
        </div>

        <div className={`mt-12 grid gap-6 ${GRID_BY_COUNT[tiers.length] ?? GRID_BY_COUNT[4]}`}>
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-3xl bg-white p-8 ${
                tier.vip
                  ? 'vip-card'
                  : tier.popular
                    ? 'border border-primary shadow-lg ring-1 ring-primary'
                    : 'border border-slate-100 shadow-sm'
              }`}
            >
              {tier.vip ? (
                <span className="vip-badge absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-extrabold tracking-wide shadow">
                  <Crown className="h-3.5 w-3.5" />
                  VIP{tier.popular ? ' · Phổ biến nhất' : ''}
                </span>
              ) : tier.popular && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow">
                  <Sparkles className="h-3.5 w-3.5" />
                  Phổ biến nhất
                </span>
              )}

              <h3 className="text-lg font-bold">{tier.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{tier.description}</p>

              <div className="mt-6 flex flex-wrap items-baseline gap-x-1.5">
                {tier.price > 0 ? (
                  <>
                    <span className="whitespace-nowrap text-3xl font-extrabold tracking-tight">{formatVnd(tier.price)}</span>
                    <span className="whitespace-nowrap text-sm text-slate-500">{tier.period}</span>
                  </>
                ) : (
                  // Giá 0 = chưa công bố giá
                  <span className="text-2xl font-extrabold tracking-tight">Liên hệ báo giá</span>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-600">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${tier.vip ? 'text-amber-500' : 'text-primary'}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={CONTACT.zaloUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-8 inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold transition ${
                  tier.vip
                    ? 'vip-badge shadow-md hover:brightness-105'
                    : tier.popular
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                Liên hệ tư vấn gói này
              </a>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          * Giá tham khảo, liên hệ{' '}
          <a href={CONTACT.telUrl} className="font-semibold text-slate-500 hover:text-primary">
            {CONTACT.phoneDisplay}
          </a>{' '}
          (gọi hoặc Zalo) để được tư vấn và báo giá chính xác theo nhu cầu.
        </p>
      </div>
    </section>
  );
}
