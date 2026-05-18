export const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  CONVERTED: 'CONVERTED',
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING: 'Chờ duyệt',
  CONFIRMED: 'Đã duyệt',
  CANCELLED: 'Đã từ chối',
  CONVERTED: 'Đã tạo đơn',
};

export const BOOKING_STATUS_COLOR: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  CONVERTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};
