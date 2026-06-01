import type { ShopSettings } from '@/services/api/settings.api';

export interface InvoiceTotals {
  subtotal: number;
  shippingFee: number;
  discount: number;
  grandTotal: number;
}

export interface InvoiceTotalsOrder {
  totalAmount: number;
  discountAmount?: number;
  fromBooking?: boolean;
}

export function getBookingShippingFee(settings: ShopSettings): number {
  const fee = Number(settings.bookingShippingFee ?? 0);
  return fee > 0 ? fee : 0;
}

/** Phí ship cho đơn booking: FREESHIP nếu tổng >= ngưỡng, ngược lại tính phí */
function bookingShipFor(subtotal: number, settings: ShopSettings): number {
  const fee = getBookingShippingFee(settings);
  if (fee <= 0) return 0;
  const threshold = Number(settings.freeShipThreshold ?? 0);
  if (threshold > 0 && subtotal >= threshold) return 0; // đủ điều kiện freeship
  return fee;
}

export function calcInvoiceTotals(
  order: InvoiceTotalsOrder,
  settings: ShopSettings,
): InvoiceTotals {
  const subtotal = Number(order.totalAmount);
  const discount = Number(order.discountAmount ?? 0);
  const shippingFee = order.fromBooking ? bookingShipFor(subtotal, settings) : 0;
  const grandTotal = subtotal + shippingFee - discount;
  return { subtotal, shippingFee, discount, grandTotal };
}
