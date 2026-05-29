import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

export const formatDateTime = (value: string | Date | null | undefined) => {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
};

export const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(d);
};

/**
 * Tính giá hiệu dụng dựa vào số lượng và cấu hình giá sỉ.
 * - Nếu sản phẩm không bật giá sỉ → trả về price (giá lẻ).
 * - Nếu bật → tìm tier có minQty cao nhất mà quantity >= minQty.
 * - Không khớp tier nào → trả về price (giá lẻ).
 */
export function getEffectivePrice(
  product: { price: number; wholesaleEnabled?: boolean; wholesaleTiers?: Array<{ minQty: number; price: number }> | null },
  quantity: number,
): number {
  if (!product.wholesaleEnabled || !product.wholesaleTiers?.length) return product.price;
  const sorted = [...product.wholesaleTiers].sort((a, b) => b.minQty - a.minQty);
  const match = sorted.find(t => quantity >= t.minQty);
  return match ? match.price : product.price;
}
