import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

export const formatDateTime = (value: string | Date | null | undefined) => {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d);
};

export const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(d);
};
