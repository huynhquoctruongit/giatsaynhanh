import { apiClient, unwrap } from './client';

export interface ShopSettings {
  id: string;
  shopName: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  logo: string | null;
  taxCode: string | null;
  invoiceTemplate: string;
  invoiceFontSize: number;
  customerNameFontSize: number;
  invoiceShowLogo: boolean;
  invoiceShowShopName: boolean;
  invoiceShowPhone: boolean;
  invoiceShowAddress: boolean;
  invoiceShowWebsite: boolean;
  invoiceShowBarcode: boolean;
  invoiceShowQR: boolean;
  invoiceShowDebt: boolean;
  openingHours: string | null;
  labelTemplate: string | null;
  labelFontSize: number;
  loyaltyEnabled: boolean;
  loyaltyPointsRate: number | null;
  deliveryEnabled: boolean;
  deliveryFee: number | null;
  allowNoShiftOrder: boolean;
}

export type SettingsPayload = Partial<Omit<ShopSettings, 'id'>>;

export const settingsApi = {
  get: () => unwrap<ShopSettings>(apiClient.get('/settings')),
  update: (payload: SettingsPayload) =>
    unwrap<ShopSettings>(apiClient.patch('/settings', payload)),
};
