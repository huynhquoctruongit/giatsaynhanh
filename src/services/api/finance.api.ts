import { apiClient, unwrap } from './client';
import type { PaginatedResult } from '@/types/api';

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Record<string, number>;
}

export interface FinanceListQuery {
  type?: TransactionType;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface TransactionPayload {
  type: TransactionType;
  category: string;
  amount: number;
  description?: string;
  date?: string;
}

export const financeApi = {
  list: (query: FinanceListQuery = {}) =>
    unwrap<PaginatedResult<Transaction>>(apiClient.get('/finance', { params: query })),
  create: (payload: TransactionPayload) =>
    unwrap<Transaction>(apiClient.post('/finance', payload)),
  update: (id: string, payload: Partial<TransactionPayload>) =>
    unwrap<Transaction>(apiClient.patch(`/finance/${id}`, payload)),
  remove: (id: string) => apiClient.delete(`/finance/${id}`),
  summary: (params: { from?: string; to?: string } = {}) =>
    unwrap<FinanceSummary>(apiClient.get('/finance/summary', { params })),
};
