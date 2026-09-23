export const STORAGE_KEYS = {
  token: 'laundry.token',
  user: 'laundry.user',
} as const;

// Riêng cho phiên platform-admin (quản lý nhiều tiệm) — khoá khác hoàn toàn
// với STORAGE_KEYS ở trên để không lẫn/ghi đè phiên đăng nhập nhân viên tiệm.
export const PLATFORM_STORAGE_KEYS = {
  token: 'platform.token',
  admin: 'platform.admin',
} as const;
