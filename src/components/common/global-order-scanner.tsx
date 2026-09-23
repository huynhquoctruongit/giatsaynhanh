'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { orderApi } from '@/services/api/order.api';
import { extractError } from '@/services/api/client';
import { matchScannedOrder } from '@/lib/utils';
import { OrderScanDialog } from '@/components/common/order-scan-dialog';
import type { Order } from '@/types/api';

// Máy quét HID gõ ký tự cách nhau rất nhanh (thường < 30ms). Nếu Enter đến
// trước khi timer này bắn thì coi là 1 lần quét; ngược lại là gõ tay bình
// thường → bỏ qua.
const SCAN_DEBOUNCE_MS = 100;

function isEditableTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return (el as HTMLElement).isContentEditable;
}

export function GlobalOrderScanner() {
  const queryClient = useQueryClient();
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const bufferRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function processScan(code: string) {
      let result;
      try {
        result = await orderApi.list({ search: code, pageSize: 10 });
      } catch (err) {
        toast.error(extractError(err).message);
        return;
      }
      const order = matchScannedOrder(result.items, code);
      if (!order) {
        toast.error('Không tìm thấy đơn', { description: code });
        return;
      }
      if (order.status === 'DELIVERED') {
        toast.info('Đơn này đã giao rồi', { description: `${order.customer?.name ?? ''} · ${order.code}` });
        return;
      }
      if (order.status === 'CANCELLED') {
        toast.error('Đơn đã huỷ', { description: `${order.customer?.name ?? ''} · ${order.code}` });
        return;
      }
      if (order.status === 'READY') {
        try {
          const updated = await orderApi.updateStatus(order.id, 'DELIVERED');
          queryClient.invalidateQueries({ queryKey: ['orders'] });
          queryClient.invalidateQueries({ queryKey: ['order', order.id] });
          queryClient.invalidateQueries({ queryKey: ['report'] });
          toast.success('✓ Đã giao', { description: `${updated.customer?.name ?? ''} · ${updated.code}` });
        } catch (err) {
          toast.error(extractError(err).message);
        }
        return;
      }
      setPendingOrder(order);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isEditableTarget(document.activeElement)) return;

      if (event.key === 'Enter') {
        if (timerRef.current) clearTimeout(timerRef.current);
        const code = bufferRef.current;
        bufferRef.current = '';
        if (code.length >= 3) {
          event.preventDefault();
          void processScan(code);
        }
        return;
      }

      if (event.key.length !== 1) return;

      bufferRef.current += event.key;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        bufferRef.current = '';
      }, SCAN_DEBOUNCE_MS);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [queryClient]);

  return (
    <OrderScanDialog order={pendingOrder} open={!!pendingOrder} onClose={() => setPendingOrder(null)} />
  );
}
