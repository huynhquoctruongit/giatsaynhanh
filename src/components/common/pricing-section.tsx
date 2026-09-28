'use client';

import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';

type Period = 'month' | 'year' | 'multi';

const PERIODS: { key: Period; label: string; months: number }[] = [
  { key: 'month', label: 'Theo tháng', months: 1 },
  { key: 'year', label: 'Theo năm', months: 12 },
  { key: 'multi', label: 'Nhiều năm (3 năm)', months: 36 },
];

interface Tier {
  name: string;
  desc: string;
  popular?: boolean;
  monthlyPrice: number;
  price: Record<Period, number>;
  features: string[];
}

// Giá tham khảo — chỉnh lại theo chính sách giá thật của bạn.
const TIERS: Tier[] = [
  {
    name: 'Cơ bản',
    desc: 'Tiệm nhỏ, mới bắt đầu số hoá quy trình.',
    monthlyPrice: 199_000,
    price: { month: 199_000, year: 1_990_000, multi: 4_990_000 },
    features: [
      'Quản lý đơn hàng & khách hàng',
      'In hoá đơn nhiệt (Bluetooth/Wifi)',
      '1 tài khoản nhân viên',
      'Đặt lịch qua quét mã QR',
      'Hỗ trợ qua Zalo/Email',
    ],
  },
  {
    name: 'Chuyên nghiệp',
    desc: 'Vận hành chuyên nghiệp, nhiều nhân viên.',
    popular: true,
    monthlyPrice: 349_000,
    price: { month: 349_000, year: 3_490_000, multi: 8_990_000 },
    features: [
      'Tất cả tính năng gói Cơ bản',
      'Không giới hạn tài khoản nhân viên',
      'Thanh toán VietQR tự động theo số tiền',
      'Quản lý kho, thu chi, công nợ',
      'Tích điểm khách hàng',
      'Báo cáo & thống kê chi tiết',
    ],
  },
  {
    name: 'Cao cấp',
    desc: 'Chuỗi nhiều chi nhánh, cần hỗ trợ riêng.',
    monthlyPrice: 599_000,
    price: { month: 599_000, year: 5_990_000, multi: 14_990_000 },
    features: [
      'Tất cả tính năng gói Chuyên nghiệp',
      'Quản lý đa chi nhánh',
      'Phân quyền nhân viên nâng cao',
      'Hỗ trợ ưu tiên 24/7',
      'Tư vấn triển khai riêng',
    ],
  },
];

function formatVnd(v: number) {
  return v.toLocaleString('vi-VN') + 'đ';
}

export function PricingSection() {
  const [period, setPeriod] = useState<Period>('month');
  const periodMeta = PERIODS.find((p) => p.key === period)!;

  return (
    <section id="pricing" className="bg-slate-50/60 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Bảng giá</h2>
          <p className="mt-3 text-slate-600">Chọn gói phù hợp quy mô tiệm — đổi gói bất cứ lúc nào.</p>
        </div>

        {/* Period switch */}
        <div className="mx-auto mt-8 flex w-fit items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                period === p.key
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => {
            const price = tier.price[period];
            const fullPrice = tier.monthlyPrice * periodMeta.months;
            const savingPct =
              period === 'month' ? 0 : Math.round((1 - price / fullPrice) * 100);

            return (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-3xl border bg-white p-8 shadow-sm ${
                  tier.popular ? 'border-primary shadow-lg ring-1 ring-primary' : 'border-slate-100'
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow">
                    <Sparkles className="h-3.5 w-3.5" />
                    Phổ biến nhất
                  </span>
                )}

                <h3 className="text-lg font-bold">{tier.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{tier.desc}</p>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold tracking-tight">{formatVnd(price)}</span>
                  <span className="text-sm text-slate-500">
                    /{period === 'month' ? 'tháng' : period === 'year' ? 'năm' : '3 năm'}
                  </span>
                </div>
                {savingPct > 0 && (
                  <span className="mt-1.5 inline-flex w-fit items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    Tiết kiệm ~{savingPct}% so với trả theo tháng
                  </span>
                )}

                <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-600">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#contact"
                  className={`mt-8 inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold transition ${
                    tier.popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Liên hệ tư vấn gói này
                </a>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          * Giá tham khảo, liên hệ để được tư vấn và báo giá chính xác theo nhu cầu.
        </p>
      </div>
    </section>
  );
}
