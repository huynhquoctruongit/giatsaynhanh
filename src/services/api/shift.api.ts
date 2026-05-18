import { apiClient, unwrap } from './client';
import type { PaginatedResult } from '@/types/api';

export interface ShiftAttendance {
  id: string;
  shiftId: string;
  userId: string;
  user?: { id: string; name: string; email: string };
  checkIn: string;
  checkOut: string | null;
  note: string | null;
}

export interface Shift {
  id: string;
  name: string;
  note: string | null;
  isOpen: boolean;
  openedAt: string;
  closedAt: string | null;
  createdBy?: { id: string; name: string };
  attendance: ShiftAttendance[];
  createdAt: string;
}

export interface ShiftListQuery {
  isOpen?: boolean;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export const shiftApi = {
  list: (query: ShiftListQuery = {}) =>
    unwrap<PaginatedResult<Shift>>(apiClient.get('/shifts', { params: query })),
  current: () => unwrap<Shift | null>(apiClient.get('/shifts/current')),
  detail: (id: string) => unwrap<Shift>(apiClient.get(`/shifts/${id}`)),
  create: (payload: { name: string; note?: string }) =>
    unwrap<Shift>(apiClient.post('/shifts', payload)),
  close: (id: string, payload: { note?: string } = {}) =>
    unwrap<Shift>(apiClient.patch(`/shifts/${id}/close`, payload)),
  checkIn: (id: string, payload: { userId: string; checkIn?: string; note?: string }) =>
    unwrap<ShiftAttendance>(apiClient.post(`/shifts/${id}/attendance`, payload)),
  checkOut: (id: string, attendanceId: string) =>
    unwrap<ShiftAttendance>(
      apiClient.patch(`/shifts/${id}/attendance/${attendanceId}/checkout`),
    ),
};
