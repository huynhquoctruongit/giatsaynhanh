import { apiClient, unwrap } from './client';
import type {
  Order,
  PaginatedResult,
  PublicOrder,
  ScanHistoryEntry,
} from '@/types/api';
import type { OrderStatus } from '@/helpers/enums/order-status';

export interface OrderListQuery {
  search?: string;
  status?: OrderStatus;
  customerId?: string;
  page?: number;
  pageSize?: number;
}

export interface OrderItemPayload {
  productId?: string;
  name: string;
  quantity: number;
  weight?: number;
  unitPrice: number;
}

export interface CreateOrderPayload {
  customerId: string;
  note?: string;
  pickupAt?: string;
  items: OrderItemPayload[];
}

export const orderApi = {
  statusCounts: () =>
    unwrap<Record<string, number>>(apiClient.get('/orders/status-counts')),
  list: (query: OrderListQuery = {}) =>
    unwrap<PaginatedResult<Order>>(apiClient.get('/orders', { params: query })),
  detail: (id: string) => unwrap<Order>(apiClient.get(`/orders/${id}`)),
  create: (payload: CreateOrderPayload) =>
    unwrap<Order>(apiClient.post('/orders', payload)),
  update: (id: string, payload: Partial<CreateOrderPayload>) =>
    unwrap<Order>(apiClient.patch(`/orders/${id}`, payload)),
  updateStatus: (id: string, status: OrderStatus) =>
    unwrap<Order>(apiClient.patch(`/orders/${id}/status`, { status })),
  remove: (id: string) => apiClient.delete(`/orders/${id}`),
  qrDataUrl: (id: string) =>
    unwrap<{ token: string; dataUrl: string; code: string }>(
      apiClient.get(`/orders/${id}/qr`),
    ),
  scanHistory: (id: string) =>
    unwrap<ScanHistoryEntry[]>(apiClient.get(`/orders/${id}/scan-history`)),
};

export const qrApi = {
  verify: (token: string) =>
    unwrap<Order | PublicOrder>(apiClient.get(`/qr/${token}`)),
  staffScan: (token: string) =>
    unwrap<Order>(apiClient.post(`/qr/${token}/scan`)),
};
