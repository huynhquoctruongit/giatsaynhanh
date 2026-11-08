import { apiClient, unwrap } from './client';

export type PromoType = 'PERCENT' | 'AMOUNT';

export interface ShopSettings {
  id: string;
  shopSlug: string;
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
  invoiceNote: string | null;
  smallOrderNote: string | null;
  /** Dòng phụ in dưới tên tiệm trên bill (vd "Cơ sở 1"), tối đa 100 ký tự */
  invoiceSubtitle: string | null;
  /** Giảm giá toàn bộ dịch vụ (vd khai trương) — BE tự trừ vào đơn khi tạo/sửa */
  promoEnabled: boolean;
  promoType: PromoType;
  /** % (≤ 100) hoặc số tiền mỗi đơn — Decimal có thể về dạng string */
  promoValue: number | string;
  /** YYYY-MM-DD (giờ VN), gồm cả ngày này */
  promoStartDate: string | null;
  /** YYYY-MM-DD (giờ VN), gồm cả ngày này */
  promoEndDate: string | null;
  /** Nhãn hiện trên bill, vd "Khai trương" */
  promoLabel: string | null;
  /** (chỉ đọc) Đợt giảm đang áp dụng hôm nay */
  promoActiveNow: boolean;
  /** Tiền lẻ để sẵn trong két đầu ngày (mặc định 750k) — dùng khi chốt két */
  openingCash: number | string;
  /** Chi phí mặc định mỗi ngày khi chốt két (mặc định 25k) */
  defaultExpenses: number | string;
  /** Giờ đóng cửa "HH:mm" — nhắc chốt két trước 10 phút */
  closeTime: string;
  bankBin: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  labelTemplate: string | null;
  labelFontSize: number;
  loyaltyEnabled: boolean;
  loyaltyPointsRate: number | null;
  deliveryEnabled: boolean;
  deliveryFee: number | null;
  bookingShippingFee: number | null;
  freeShipThreshold: number | null;
  allowNoShiftOrder: boolean;
  bookingQrEnabled: boolean;
  bookingQrUrl: string;
  subscriptionEndsAt: string;
  currentPlan: string;
  subscriptionDaysRemaining: number;
}

export type SettingsPayload = Partial<
  Omit<
    ShopSettings,
    | 'id'
    | 'shopSlug'
    | 'bookingQrUrl'
    | 'subscriptionEndsAt'
    | 'currentPlan'
    | 'subscriptionDaysRemaining'
    | 'promoActiveNow'
  >
>;

export interface PublicShopInfo {
  shopId: string;
  shopSlug: string;
  shopName: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  openingHours: string | null;
  bookingQrEnabled: boolean;
}

export const settingsApi = {
  get: () => unwrap<ShopSettings>(apiClient.get('/settings')),
  update: (payload: SettingsPayload) =>
    unwrap<ShopSettings>(apiClient.patch('/settings', payload)),
  getPublic: (shopSlug: string) =>
    unwrap<PublicShopInfo>(apiClient.get(`/settings/public/${shopSlug}`)),
};
