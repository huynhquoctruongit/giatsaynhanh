import { redirect } from 'next/navigation';

// /admin → vào thẳng trang Tổng quan của khu quản lý
export default function AdminIndexPage() {
  redirect('/admin/dashboard');
}
