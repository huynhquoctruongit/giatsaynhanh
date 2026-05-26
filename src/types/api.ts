import type { OrderStatus, UserRole } from '@/helpers/enums/order-status';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string; details?: unknown };
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  isActive: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id?: string;
  productId?: string | null;
  name: string;
  quantity: number;
  weight: number | null;
  unitPrice: number;
  subtotal?: number;
}

export interface OrderCustomerSummary {
  id?: string;
  name: string;
  phone?: string;
  address?: string | null;
}

export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  totalAmount: number;
  discountAmount?: number;
  note: string | null;
  pickupAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: OrderCustomerSummary | null;
  items: OrderItem[];
  qr: { token: string; url: string };
  fromBooking?: boolean;
  booking?: { id: string; code: string } | null;
}

export interface PublicOrder {
  code: string;
  status: OrderStatus;
  totalAmount: number;
  note: string | null;
  pickupAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  customer: { name: string; phone: string } | null;
  items: Pick<OrderItem, 'name' | 'quantity' | 'weight'>[];
}

export interface BookingItem {
  id?: string;
  productId?: string | null;
  name: string;
  quantity: number;
  weight: number | null;
  unitPrice: number;
  subtotal?: number;
}

export interface BookingPrefillItem {
  productId?: string | null;
  name: string;
  quantity: number;
  weight: number | null;
  unitPrice: number;
}

export interface BookingPrefillActiveOrder {
  id: string;
  code: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  pickupAt: string | null;
  items: { name: string; quantity: number; weight: number | null }[];
}

export interface BookingPrefillService {
  id: string;
  name: string;
  unit: string;
  price: number;
}

export interface BookingPrefill {
  sourceOrder: { id: string; code: string; createdAt: string };
  customer: {
    id: string;
    name: string;
    phone: string;
    address: string | null;
  };
  items: BookingPrefillItem[];
  activeOrders: BookingPrefillActiveOrder[];
  services: BookingPrefillService[];
}

export type BookingStatusValue = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CONVERTED';

export interface Booking {
  id: string;
  code: string;
  status: BookingStatusValue;
  phone: string;
  address: string;
  note: string | null;
  pickupAt: string | null;
  deliveryAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    address: string | null;
  } | null;
  sourceOrder: { id: string; code: string } | null;
  convertedOrder: { id: string; code: string } | null;
  items: BookingItem[];
}

export interface ScanHistoryEntry {
  id: string;
  orderId: string;
  userId: string | null;
  action: 'VIEW' | 'UPDATE_STATUS';
  ip: string | null;
  userAgent: string | null;
  meta: Record<string, unknown> | null;
  scannedAt: string;
  user: { id: string; name: string; email: string; role: UserRole } | null;
}
