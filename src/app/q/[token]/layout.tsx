import type { Metadata } from 'next';

const TITLE = 'GIẶT SẤY NHANH - QUÉT QR để đặt giao nhận';
const DESCRIPTION =
  'Tiệm Giặt Sấy Nhanh - chất lượng NHÌ Thủ Đức, còn ở đâu NHẤT thì sốp hông biết';

const OG_IMAGE = {
  url: '/og-cover.jpg',
  width: 960,
  height: 1280,
  alt: 'Tiệm Giặt Sấy Nhanh',
};

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og-cover.jpg'],
  },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
