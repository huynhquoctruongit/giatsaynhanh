import type { Metadata } from 'next';

const TITLE = 'GIẶT SẤY NHANH - QUÉT QR để đặt giao nhận';
const DESCRIPTION =
  'Tiệm Giặt Sấy Nhanh - chất lượng NHÌ Thủ Đức, còn ở đâu NHẤT thì sốp hông biết';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
