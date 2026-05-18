export const OrderStatus = {
  CREATED: 'CREATED',
  RECEIVED: 'RECEIVED',
  WASHING: 'WASHING',
  READY: 'READY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  CREATED: 'Đã tạo',
  RECEIVED: 'Đã nhận đồ',
  WASHING: 'Đang giặt',
  READY: 'Sẵn sàng giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã huỷ',
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  CREATED: 'bg-slate-100 text-slate-700 border-slate-200',
  RECEIVED: 'bg-blue-50 text-blue-700 border-blue-200',
  WASHING: 'bg-amber-50 text-amber-700 border-amber-200',
  READY: 'bg-violet-50 text-violet-700 border-violet-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const NEXT_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: ['WASHING', 'CANCELLED'],
  WASHING: ['READY', 'CANCELLED'],
  READY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const UserRole = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
