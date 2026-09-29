'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Clock, Loader2, Timer, X } from 'lucide-react';
import { timesheetApi } from '@/services/api/timesheet.api';
import { extractError } from '@/services/api/client';
import { cn } from '@/lib/utils';

// Trang có thanh nút cố định ở đáy (vd "Tạo đơn") → ẩn nút nổi để không che nút chính
const HIDE_ON = ['/admin/orders/new'];

const pad2 = (n: number) => n.toString().padStart(2, '0');
const hhmm = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

/** Đồng hồ chạy theo giây — chỉ chạy khi popup đang mở. */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

/**
 * Nút tròn nổi trên mọi trang quản lý để nhân viên tự chấm công (giống app).
 * Bấm → popup toàn màn hình với 1 nút to hiện giờ:phút: chưa vào ca thì "Vào ca",
 * đang trong ca thì "Kết ca". Giờ tính lương làm tròn 30' ở backend.
 */
export function TimeClockButton() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const now = useNow(open);

  const currentQuery = useQuery({
    queryKey: ['timesheet', 'current'],
    queryFn: () => timesheetApi.current(),
    staleTime: 60_000,
  });
  const current = currentQuery.data;
  const inShift = Boolean(current);
  const busy = currentQuery.isFetching;

  const mutation = useMutation({
    mutationFn: () => (inShift ? timesheetApi.checkOut() : timesheetApi.checkIn()),
    onSuccess: (entry) => {
      const at = hhmm(new Date(entry.checkOut ?? entry.checkIn));
      toast.success(inShift ? `Đã kết ca lúc ${at}` : `Đã vào ca lúc ${at}`);
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      setOpen(false);
    },
    onError: (err) => {
      toast.error(extractError(err).message);
      // Trạng thái có thể đã đổi ở máy khác — tải lại.
      queryClient.invalidateQueries({ queryKey: ['timesheet', 'current'] });
    },
  });

  // Esc để đóng popup
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const pathname = usePathname();
  const hidden = HIDE_ON.some((p) => pathname.startsWith(p));

  const accent = inShift ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600';

  return (
    <>
      {!hidden && (
      <button
        type="button"
        aria-label={inShift ? 'Kết ca' : 'Vào ca'}
        title={inShift ? 'Kết ca' : 'Vào ca'}
        onClick={() => {
          currentQuery.refetch();
          setOpen(true);
        }}
        className={cn(
          'fixed bottom-6 right-5 z-[15] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95',
          'mb-[env(safe-area-inset-bottom)]',
          accent,
        )}
      >
        {inShift ? <Timer className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
      </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background p-6">
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => setOpen(false)}
            className="absolute right-5 top-5 mt-[env(safe-area-inset-top)] rounded-full p-2 text-muted-foreground hover:bg-accent"
          >
            <X className="h-8 w-8" />
          </button>

          <h2 className="text-3xl font-extrabold">{inShift ? 'Kết ca' : 'Vào ca'}</h2>
          <p className="mb-6 text-muted-foreground">
            {current
              ? `Bạn đã vào ca lúc ${hhmm(new Date(current.checkIn))}`
              : 'Bấm vào đồng hồ để xác nhận vào ca'}
          </p>

          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || busy}
            className={cn(
              'flex h-72 w-72 flex-col items-center justify-center rounded-full text-white shadow-2xl transition active:scale-[0.97] disabled:opacity-80',
              accent,
            )}
          >
            {mutation.isPending || busy ? (
              <Loader2 className="h-12 w-12 animate-spin" />
            ) : (
              <>
                <span className="text-[76px] font-extrabold leading-none tabular-nums">{hhmm(now)}</span>
                <span className="mt-2 text-2xl font-extrabold tracking-widest">{inShift ? 'KẾT CA' : 'VÀO CA'}</span>
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}
