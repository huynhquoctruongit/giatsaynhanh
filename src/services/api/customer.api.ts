import { apiClient, unwrap } from './client';
import type { Customer, PaginatedResult } from '@/types/api';

export interface CustomerListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CustomerPayload {
  name: string;
  phone: string;
  address?: string;
  note?: string;
}

export const customerApi = {
  list: (query: CustomerListQuery = {}) =>
    unwrap<PaginatedResult<Customer>>(apiClient.get('/customers', { params: query })),
  detail: (id: string) => unwrap<Customer>(apiClient.get(`/customers/${id}`)),
  create: (payload: CustomerPayload) =>
    unwrap<Customer>(apiClient.post('/customers', payload)),
  update: (id: string, payload: Partial<CustomerPayload>) =>
    unwrap<Customer>(apiClient.patch(`/customers/${id}`, payload)),
  remove: (id: string) => apiClient.delete(`/customers/${id}`),
};
