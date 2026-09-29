import type { MetadataRoute } from 'next';

// PWA: "Thêm vào màn hình chính" trên iPhone/Android → mở toàn màn hình như app,
// không thấy thanh địa chỉ. Vào thẳng khu quản lý (chưa đăng nhập sẽ tự về /login).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Giặt Sấy Nhanh — Quản lý đơn',
    short_name: 'Giặt Sấy',
    description: 'Quản lý đơn giặt sấy với QR code',
    start_url: '/admin',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    lang: 'vi',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
