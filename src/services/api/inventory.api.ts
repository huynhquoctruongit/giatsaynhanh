import { apiClient, unwrap } from './client';
import type { PaginatedResult } from '@/types/api';

export type InventoryLogType = 'IMPORT' | 'EXPORT' | 'ADJUST';

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number | null;
  importPrice: number | null;
  note: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryLog {
  id: string;
  itemId: string;
  item?: { id: string; name: string; unit: string };
  type: InventoryLogType;
  quantity: number;
  unitPrice: number | null;
  note: string | null;
  createdAt: string;
}

export interface InventoryItemListQuery {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface InventoryLogListQuery {
  itemId?: string;
  type?: InventoryLogType;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface InventoryItemPayload {
  name: string;
  unit: string;
  quantity?: number;
  minQuantity?: number;
  importPrice?: number;
  note?: string;
}

export interface InventoryLogPayload {
  itemId: string;
  type: InventoryLogType;
  quantity: number;
  unitPrice?: number;
  note?: string;
}

export const inventoryApi = {
  items: {
    list: (query: InventoryItemListQuery = {}) =>
      unwrap<PaginatedResult<InventoryItem>>(
        apiClient.get('/inventory/items', { params: query }),
      ),
    create: (payload: InventoryItemPayload) =>
      unwrap<InventoryItem>(apiClient.post('/inventory/items', payload)),
    update: (id: string, payload: Partial<InventoryItemPayload>) =>
      unwrap<InventoryItem>(apiClient.patch(`/inventory/items/${id}`, payload)),
    remove: (id: string) => apiClient.delete(`/inventory/items/${id}`),
  },
  logs: {
    list: (query: InventoryLogListQuery = {}) =>
      unwrap<PaginatedResult<InventoryLog>>(
        apiClient.get('/inventory/logs', { params: query }),
      ),
    create: (payload: InventoryLogPayload) =>
      unwrap<InventoryLog>(apiClient.post('/inventory/logs', payload)),
  },
  lowStock: () => unwrap<InventoryItem[]>(apiClient.get('/inventory/low-stock')),
};
