import { platformClient } from './platform-client';
import { unwrap } from './client';

export interface PlatformAdmin {
  id: string;
  email: string;
  name: string;
}

export interface PlatformLoginPayload {
  email: string;
  password: string;
}

export interface PlatformLoginResult {
  token: string;
  admin: PlatformAdmin;
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  webhookToken: string | null;
  hasWebhookSecret: boolean;
  _count: { users: number };
}

export interface CreateShopPayload {
  name: string;
  slug: string;
  phone?: string;
  address?: string;
}

export interface CreateShopAdminPayload {
  email: string;
  password: string;
  name: string;
}

export interface ShopAdmin {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const platformApi = {
  login: (payload: PlatformLoginPayload) =>
    unwrap<PlatformLoginResult>(platformClient.post('/platform/login', payload)),
  listShops: () => unwrap<Shop[]>(platformClient.get('/platform/shops')),
  createShop: (payload: CreateShopPayload) =>
    unwrap<Shop>(platformClient.post('/platform/shops', payload)),
  createShopAdmin: (shopId: string, payload: CreateShopAdminPayload) =>
    unwrap<ShopAdmin>(platformClient.post(`/platform/shops/${shopId}/admins`, payload)),
  rotateWebhookToken: (shopId: string) =>
    unwrap<{ webhookToken: string }>(
      platformClient.post(`/platform/shops/${shopId}/webhook/token`),
    ),
  setWebhookSecret: (shopId: string, webhookSecret: string) =>
    unwrap<{ hasWebhookSecret: boolean }>(
      platformClient.put(`/platform/shops/${shopId}/webhook/secret`, { webhookSecret }),
    ),
};

/** Base URL API dùng để hiển thị link webhook đầy đủ cho từng tiệm. */
export const PLATFORM_API_BASE_URL = 'https://laundry-qr-backend.onrender.com/api';
