import { apiClient, unwrap } from './client';
import type {
  Booking,
  BookingPrefill,
  BookingStatusValue,
  PaginatedResult,
} from '@/types/api';

export interface BookingListQuery {
  search?: string;
  status?: BookingStatusValue;
  customerId?: string;
  page?: number;
  pageSize?: number;
}

export interface BookingItemPayload {
  productId?: string;
  name: string;
  quantity: number;
  weight?: number;
  unitPrice: number;
}

export interface CreateBookingFromQrPayload {
  phone: string;
  address: string;
  pickupAt?: string;
  deliveryAt?: string;
  note?: string;
  items: BookingItemPayload[];
}

export interface ConvertBookingPayload {
  items?: BookingItemPayload[];
  pickupAt?: string;
  note?: string;
  discountAmount?: number;
}

export const bookingApi = {
  list: (query: BookingListQuery = {}) =>
    unwrap<PaginatedResult<Booking>>(
      apiClient.get('/bookings', { params: query }),
    ),
  detail: (id: string) => unwrap<Booking>(apiClient.get(`/bookings/${id}`)),
  updateStatus: (id: string, status: BookingStatusValue, reason?: string) =>
    unwrap<Booking>(
      apiClient.patch(`/bookings/${id}/status`, { status, reason }),
    ),
  convert: (id: string, payload: ConvertBookingPayload = {}) =>
    unwrap<Booking>(apiClient.post(`/bookings/${id}/convert`, payload)),

  prefillFromQr: (token: string) =>
    unwrap<BookingPrefill>(apiClient.get(`/qr/${token}/booking-context`)),

  createFromQr: (token: string, payload: CreateBookingFromQrPayload) =>
    unwrap<Booking>(apiClient.post(`/qr/${token}/booking`, payload)),
};
