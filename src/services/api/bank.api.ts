import { apiClient, unwrap } from './client';

export interface BankTxn {
  id: string;
  amount: number;
  content: string | null;
  counterName: string | null;
  gateway: string | null;
  transactionAt: string;
}

export interface TodayTransfers {
  /** Tổng tiền chuyển VÀO trong ngày (VN) */
  total: number;
  count: number;
  items: BankTxn[];
}

export interface BankHistoryItem {
  id: string;
  amount: number;
  content: string | null;
  counterName: string | null;
  counterAccount: string | null;
  gateway: string | null;
  transactionAt: string;
  /** Đơn đã khớp tự động (null = chưa khớp đơn nào) */
  order: { id: string; code: string; customerName: string | null } | null;
}

export interface BankHistoryParams {
  /** YYYY-MM-DD (giờ VN) — mặc định hôm nay */
  from?: string;
  /** YYYY-MM-DD (giờ VN) — mặc định = from */
  to?: string;
  /** Tìm theo nội dung / tên người chuyển / mã đơn */
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface BankHistory {
  from: string;
  to: string;
  /** Tổng tiền nhận trên toàn bộ bộ lọc (không chỉ trang hiện tại) */
  total: number;
  count: number;
  page: number;
  pageSize: number;
  items: BankHistoryItem[];
}

export const bankApi = {
  today: (params: { date?: string } = {}) =>
    unwrap<TodayTransfers>(apiClient.get('/bank/today', { params })),
  history: (params: BankHistoryParams = {}) =>
    unwrap<BankHistory>(apiClient.get('/bank/transactions', { params })),
};
