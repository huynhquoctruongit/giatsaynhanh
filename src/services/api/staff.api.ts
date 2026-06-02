import { apiClient, unwrap } from './client';
import type { PaginatedResult } from '@/types/api';
import type { UserRole } from '@/helpers/enums/order-status';

export interface StaffMember {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  // Backend trả về dạng map {KEY: true}; FE gửi lên dạng mảng key đang bật
  permissions: Record<string, boolean>;
  orderViewTimeLimit: number | string | null;
  createdAt: string;
}

export interface StaffListQuery {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateStaffPayload {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
  permissions?: string[];
}

export interface UpdateStaffPayload {
  name?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface StaffPermissionsPayload {
  permissions: string[];
  orderViewTimeLimit?: number | null;
}

export const staffApi = {
  list: (query: StaffListQuery = {}) =>
    unwrap<PaginatedResult<StaffMember>>(apiClient.get('/staff', { params: query })),
  create: (payload: CreateStaffPayload) =>
    unwrap<StaffMember>(apiClient.post('/staff', payload)),
  update: (id: string, payload: UpdateStaffPayload) =>
    unwrap<StaffMember>(apiClient.patch(`/staff/${id}`, payload)),
  updatePermissions: (id: string, payload: StaffPermissionsPayload) =>
    unwrap<StaffMember>(apiClient.patch(`/staff/${id}/permissions`, payload)),
  resetPassword: (id: string, password: string) =>
    unwrap<{ success: boolean }>(apiClient.patch(`/staff/${id}/password`, { password })),
  remove: (id: string) => apiClient.delete(`/staff/${id}`),
};
