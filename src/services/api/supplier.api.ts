import { apiClient, unwrap } from './client';
import type { PaginatedResult } from '@/types/api';

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  email: string | null;
  note: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierListQuery {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface SupplierPayload {
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  note?: string;
}

export const supplierApi = {
  list: (query: SupplierListQuery = {}) =>
    unwrap<PaginatedResult<Supplier>>(apiClient.get('/suppliers', { params: query })),
  detail: (id: string) => unwrap<Supplier>(apiClient.get(`/suppliers/${id}`)),
  create: (payload: SupplierPayload) =>
    unwrap<Supplier>(apiClient.post('/suppliers', payload)),
  update: (id: string, payload: Partial<SupplierPayload>) =>
    unwrap<Supplier>(apiClient.patch(`/suppliers/${id}`, payload)),
  remove: (id: string) => apiClient.delete(`/suppliers/${id}`),
};
