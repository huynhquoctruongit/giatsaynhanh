import type { ShopSettings } from '@/services/api/settings.api';

/**
 * Giảm giá toàn bộ dịch vụ theo khoảng ngày (ShopSettings.promo*), vd khai trương.
 * Đồng bộ với backend (helpers/utils/promo.ts): ngày so theo giờ VN, gồm cả ngày
 * bắt đầu và ngày kết thúc; số tiền giảm làm tròn xuống 1.000đ, không vượt tổng đơn.
 * Backend tự ghi Order.discountAmount — ở web chỉ dùng để hiển thị ước tính.
 */
export type PromoSettings = Partial<
  Pick<ShopSettings, 'promoEnabled' | 'promoType' | 'promoValue' | 'promoStartDate' | 'promoEndDate'>
>;

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Ngày YYYY-MM-DD theo giờ VN */
export const vnDateStr = (d: Date = new Date()) =>
  new Date(d.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);

export function isPromoActive(
  s: PromoSettings | null | undefined,
  at: Date = new Date(),
): boolean {
  if (!s?.promoEnabled || !(Number(s.promoValue ?? 0) > 0)) return false;
  const day = vnDateStr(at);
  if (s.promoStartDate && day < s.promoStartDate) return false;
  if (s.promoEndDate && day > s.promoEndDate) return false;
  return true;
}

/** Số tiền giảm cho 1 đơn có tổng dịch vụ `subtotal` (0 nếu không trong đợt giảm). */
export function calcPromoDiscount(
  s: PromoSettings | null | undefined,
  subtotal: number,
  at: Date = new Date(),
): number {
  if (!isPromoActive(s, at) || subtotal <= 0) return 0;
  const value = Number(s!.promoValue);
  const raw = s!.promoType === 'AMOUNT' ? value : (subtotal * Math.min(value, 100)) / 100;
  return Math.min(subtotal, Math.floor(raw / 1000) * 1000);
}

/** Nhãn hiển thị, vd "Khai trương -20%" hoặc "-10.000đ" */
export function promoBadgeText(s: PromoSettings & { promoLabel?: string | null }): string {
  const value = Number(s.promoValue ?? 0);
  const amount =
    s.promoType === 'AMOUNT'
      ? `-${new Intl.NumberFormat('vi-VN').format(value)}đ`
      : `-${Math.min(value, 100)}%`;
  return [s.promoLabel?.trim(), amount].filter(Boolean).join(' ');
}
