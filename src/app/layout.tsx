import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  metadataBase: new URL('https://giatsaynhanh.vercel.app'),
  title: 'GIẶT SẤY NHANH - QUẢN LÝ ĐƠN',
  description: 'Quản lý đơn giặt sấy với QR code',
  // iPhone: "Thêm vào MH chính" → chạy toàn màn hình (không thanh địa chỉ) với icon riêng
  appleWebApp: { capable: true, title: 'Giặt Sấy', statusBarStyle: 'default' },
  icons: { apple: '/apple-touch-icon.png' },
  // iOS cũ chỉ đọc thẻ này (Next chỉ sinh mobile-web-app-capable)
  other: { 'apple-mobile-web-app-capable': 'yes' },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
