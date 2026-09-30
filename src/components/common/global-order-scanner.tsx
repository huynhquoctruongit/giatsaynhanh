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
// Trong ô nhập (vd ô tìm kiếm trang Đơn hàng): máy quét vẫn gõ vào ô đó. Nhận ra máy quét
// khi các phím cách nhau < SCAN_KEY_GAP_MS (người gõ tay không nhanh vậy) và đủ dài.
const SCAN_KEY_GAP_MS = 50;
const MIN_SCAN_LENGTH_IN_INPUT = 4;

/** Gán lại giá trị cho ô nhập React-controlled (để React nhận thay đổi). */
function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

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
  const lastKeyAtRef = useRef(0);
  // Giá trị ô nhập ngay trước loạt phím quét → trả lại sau khi nhận ra là máy quét
  const snapshotRef = useRef<{ el: HTMLInputElement | HTMLTextAreaElement; value: string } | null>(null);

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
      const active = document.activeElement;
      if (isEditableTarget(active)) {
        // Ô tự xử lý mã quét (vd trang Rà soát đơn) → để nguyên
        if (active?.closest('[data-scan-own]')) return;
        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
          handleKeyInInput(event, active);
        }
        return;
      }

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

    /** Máy quét gõ vào ô nhập: loạt phím rất nhanh + Enter → xử lý như quét, trả ô về như cũ. */
    function handleKeyInInput(event: KeyboardEvent, el: HTMLInputElement | HTMLTextAreaElement) {
      const now = performance.now();
      const fast = now - lastKeyAtRef.current < SCAN_KEY_GAP_MS;
      lastKeyAtRef.current = now;

      if (event.key === 'Enter') {
        const code = bufferRef.current;
        const snap = snapshotRef.current;
        bufferRef.current = '';
        snapshotRef.current = null;
        if (fast && code.length >= MIN_SCAN_LENGTH_IN_INPUT && snap?.el === el) {
          event.preventDefault();
          setNativeValue(el, snap.value);
          void processScan(code);
        }
        return;
      }
      if (event.key.length !== 1) return;
      if (!fast || snapshotRef.current?.el !== el) {
        // Bắt đầu loạt phím mới — nhớ giá trị ô trước khi ký tự này được gõ vào
        bufferRef.current = '';
        snapshotRef.current = { el, value: el.value };
      }
      bufferRef.current += event.key;
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
