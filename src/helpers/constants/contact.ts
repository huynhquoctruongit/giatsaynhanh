// Thông tin liên hệ hiển thị trên web (trang chủ, bảng giá, banner gia hạn) — sửa 1 chỗ ở đây.
const PHONE = '0964353011';
const ADDRESS = '02 Đường số 12, Tăng Nhơn Phú B, Thủ Đức';

export const CONTACT = {
  phone: PHONE,
  phoneDisplay: '0964 353 011',
  telUrl: `tel:${PHONE}`,
  zaloUrl: `https://zalo.me/${PHONE}`,
  address: ADDRESS,
  mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ADDRESS}, TP. Hồ Chí Minh`)}`,
} as const;
