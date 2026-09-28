'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarClock, X } from 'lucide-react';
import { settingsApi } from '@/services/api/settings.api';
import { STORAGE_KEYS } from '@/helpers/constants/storage-keys';
import { cn, formatDate } from '@/lib/utils';

/** Bắt đầu nhắc khi còn <= số ngày này. */
const WARN_DAYS = 7;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readDismissedToday() {
  try {
    return localStorage.getItem(STORAGE_KEYS.subscriptionBannerDismissedAt) === todayKey();
  } catch {
    return false;
  }
}

/**
 * Nhắc hạn gói dịch vụ của tiệm.
 * - Còn <= WARN_DAYS ngày: banner vàng, ẩn được trong ngày.
 * - Đã hết hạn: banner đỏ, không ẩn được (backend đã chặn tạo đơn mới).
 */
export function SubscriptionBanner() {
  const [dismissed, setDismissed] = useState(readDismissedToday);
  const { data } = useQuery({ queryKey: ['settings'], queryFn: settingsApi.get });

  if (!data?.subscriptionEndsAt) return null;

  const days = data.subscriptionDaysRemaining;
  const expired = days <= 0;
  if (!expired && (days > WARN_DAYS || dismissed)) return null;

  const isTrial = data.currentPlan === 'TRIAL';
  const endDate = formatDate(data.subscriptionEndsAt);

  const message = expired
    ? `${isTrial ? 'Thời gian dùng thử' : 'Gói dịch vụ'} của tiệm đã hết hạn từ ${endDate}. Bạn vẫn xem được dữ liệu cũ nhưng không thể tạo đơn mới.`
    : `${isTrial ? 'Thời gian dùng thử' : 'Gói dịch vụ'} của tiệm còn ${days} ngày (hết hạn ${endDate}). Gia hạn sớm để không bị gián đoạn.`;

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEYS.subscriptionBannerDismissedAt, todayKey());
    } catch {
      // bỏ qua — chỉ ẩn trong phiên hiện tại
    }
    setDismissed(true);
  }

  const Icon = expired ? AlertTriangle : CalendarClock;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 border-b px-4 py-3 text-sm md:items-center md:px-8',
        expired
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'border-amber-200 bg-amber-50 text-amber-900',
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 md:mt-0" />
      <p className="flex-1">
        {message}{' '}
        <Link href="/#pricing" target="_blank" className="font-semibold underline underline-offset-2">
          Xem bảng giá & gia hạn
        </Link>
      </p>
      {!expired && (
        <button
          type="button"
          aria-label="Ẩn thông báo"
          onClick={dismiss}
          className="rounded p-0.5 opacity-70 transition hover:bg-amber-100 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
