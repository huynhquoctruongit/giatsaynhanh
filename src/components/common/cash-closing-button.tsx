'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertCircle,
  AlertTriangle,
  BellRing,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LockKeyhole,
  Trash2,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cashClosingApi, type CashClosing } from '@/services/api/cash-closing.api';
import { extractError } from '@/services/api/client';
import { useAuth } from '@/hooks/use-auth';
import { cn, formatCurrency, formatDateTime } from '@/lib/utils';

const pad2 = (n: number) => n.toString().padStart(2, '0');
const dm = (date: string) => date.split('-').reverse().slice(0, 2).join('/');
/** "1250000" → "1.250.000" (hiển thị trong ô nhập) */
const fmtInput = (digits: string) => (digits ? Number(digits).toLocaleString('vi-VN') : '');
const onlyDigits = (v: string) => v.replace(/\D/g, '').replace(/^0+(?=\d)/, '');

function diffTone(diff: number) {
  if (diff === 0) return { cls: 'bg-emerald-50 text-emerald-700', text: 'Két khớp', Icon: CheckCircle2 };
  if (diff < 0) return { cls: 'bg-rose-50 text-rose-700', text: `Thiếu ${formatCurrency(-diff)}`, Icon: AlertCircle };
  return { cls: 'bg-amber-50 text-amber-800', text: `Dư ${formatCurrency(diff)}`, Icon: AlertTriangle };
}

function Line({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className={cn('text-sm text-muted-foreground', strong && 'font-semibold text-foreground')}>{label}</span>
      <span className={cn('font-medium', muted && 'text-muted-foreground', strong && 'font-bold')}>{value}</span>
    </div>
  );
}

/** Nhắc trước giờ đóng cửa bao nhiêu phút / lặp lại tiếng nhắc mỗi … phút cho tới khi chốt */
const REMIND_BEFORE_MIN = 10;
const REPEAT_REMIND_MIN = 5;

/** Tiếng "bíp bíp" (WebAudio, không cần file âm thanh) + đọc câu nhắc tiếng Việt nếu trình duyệt hỗ trợ. */
function playReminder() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.35, 0.7].forEach((at) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + 0.25);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {
    // trình duyệt chặn âm thanh khi chưa có thao tác người dùng — bỏ qua
  }
  try {
    const u = new SpeechSynthesisUtterance('Sắp đến giờ đóng cửa, vui lòng chốt két');
    u.lang = 'vi-VN';
    setTimeout(() => window.speechSynthesis?.speak(u), 1100);
  } catch {
    // không hỗ trợ đọc giọng nói
  }
  navigator.vibrate?.([400, 200, 400, 200, 400]);
}

/**
 * Đến (giờ đóng cửa − 10') mà hôm nay chưa chốt két → trả true (nút rung) và phát tiếng nhắc,
 * lặp lại mỗi 5' cho tới khi chốt. `withSound` = chỉ nút đang hiển thị mới kêu (tránh kêu 2 lần).
 */
function useCloseReminder(closeTime: string | undefined, closed: boolean, ready: boolean, withSound: () => boolean) {
  const [alerting, setAlerting] = useState(false);
  const lastRemindAt = useRef(0);
  useEffect(() => {
    if (!ready || closed || !closeTime || !/^\d{2}:\d{2}$/.test(closeTime)) {
      setAlerting(false);
      return;
    }
    const [h, m] = closeTime.split(':').map(Number);
    const check = () => {
      const now = new Date();
      const remindAt = new Date(now);
      remindAt.setHours(h, m - REMIND_BEFORE_MIN, 0, 0);
      const due = now >= remindAt;
      setAlerting(due);
      if (due && withSound() && Date.now() - lastRemindAt.current >= REPEAT_REMIND_MIN * 60_000) {
        lastRemindAt.current = Date.now();
        playReminder();
      }
    };
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, [closeTime, closed, ready, withSound]);
  return alerting;
}

const isWide = () => window.matchMedia('(min-width: 768px)').matches;
const isNarrow = () => !isWide();

// Trang có thanh nút cố định ở đáy (vd "Tạo đơn") → ẩn nút nổi trên điện thoại
const HIDE_FAB_ON = ['/admin/orders/new'];

/**
 * Nút mở popup chốt két cuối ngày.
 *  - placement="header": nút giữa thanh header (màn hình rộng / POS)
 *  - placement="fab": nút tròn nổi ngay trên nút "Vào ca" (điện thoại)
 */
export function CashClosingButton({ placement }: { placement: 'header' | 'fab' }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const preview = useQuery({
    queryKey: ['cash-closing', 'preview'],
    queryFn: () => cashClosingApi.preview(),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000, // cập nhật trạng thái đã chốt (máy khác chốt) để tắt nhắc
  });
  const closed = Boolean(preview.data?.closing);
  const alerting = useCloseReminder(
    preview.data?.closeTime,
    closed,
    !!preview.data,
    placement === 'header' ? isWide : isNarrow,
  );

  const openDialog = () => {
    preview.refetch();
    setOpen(true);
  };
  const doneBadge = closed && (
    <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
      <Check className="h-3 w-3" />
    </span>
  );

  if (placement === 'fab' && HIDE_FAB_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <>
      {placement === 'header' ? (
        <button
          type="button"
          onClick={openDialog}
          className={cn(
            'relative hidden h-11 items-center gap-2 rounded-full px-5 font-semibold text-white shadow-md transition active:scale-95 md:inline-flex',
            alerting ? 'cash-alert bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700',
          )}
        >
          {alerting ? <BellRing className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
          {closed ? 'Đã chốt két' : alerting ? 'Đến giờ chốt két!' : 'Chốt két'}
          {doneBadge}
        </button>
      ) : (
        <button
          type="button"
          title="Chốt két"
          aria-label="Chốt két"
          onClick={openDialog}
          // Ngay trên nút "Vào ca" (bottom-6, cao 3.5rem) — chỉ hiện trên điện thoại
          className={cn(
            'fixed bottom-[5.75rem] right-5 z-[15] mb-[env(safe-area-inset-bottom)] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition active:scale-95 md:hidden',
            alerting ? 'cash-alert bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700',
          )}
        >
          {alerting ? <BellRing className="h-7 w-7" /> : <Wallet className="h-7 w-7" />}
          {doneBadge}
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Chốt két</DialogTitle>
          </DialogHeader>
          {open && <ClosingBody />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ClosingBody() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['cash-closing', 'preview'], queryFn: () => cashClosingApi.preview() });
  const p = query.data;

  const [expenses, setExpenses] = useState<string | null>(null); // null = chưa sửa → dùng mặc định
  const [counted, setCounted] = useState('');
  const [note, setNote] = useState('');

  const expenseDigits = expenses ?? String(p?.defaultExpenses ?? 0);
  const expenseNum = Number(expenseDigits) || 0;
  const expected = (p?.expectedBeforeExpenses ?? 0) - expenseNum;
  const countedNum = Number(counted) || 0;
  const diff = countedNum - expected;
  const tone = diffTone(diff);

  const submit = useMutation({
    mutationFn: () => cashClosingApi.create({ countedCash: countedNum, expenses: expenseNum, note: note.trim() || undefined }),
    onSuccess: () => {
      toast.success('Đã chốt két — đã báo chủ tiệm');
      qc.invalidateQueries({ queryKey: ['cash-closing'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  if (query.isLoading || !p) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (p.closing) {
    return (
      <div className="space-y-4">
        <ClosedSummary c={p.closing} />
        <ClosingBook />
      </div>
    );
  }

  const confirmSubmit = () => {
    if (!counted) return toast.error('Nhập số tiền mặt đếm được trong két');
    if (diff !== 0 && !note.trim()) return toast.error('Két lệch tiền — vui lòng ghi lý do');
    if (window.confirm(`Chốt két hôm nay?\nKét đếm ${formatCurrency(countedNum)} — ${tone.text.toLowerCase()}.`)) {
      submit.mutate();
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Ngày {dm(p.date)}</p>
      <div>
        <Line label="Tiền đầu ngày" value={formatCurrency(p.openingCash)} />
        <Line label={`+ Đã thu (${p.orderCount} đơn)`} value={formatCurrency(p.collected)} />
        <Line label={`− Chuyển khoản (${p.transferCount} GD)`} value={formatCurrency(p.transfers)} muted />
        <div className="flex items-center justify-between gap-4 py-0.5">
          <span className="text-sm text-muted-foreground">− Chi phí (đá, cf ông Địa…)</span>
          <Input
            className="h-9 w-32 text-right"
            inputMode="numeric"
            value={fmtInput(expenseDigits)}
            onChange={(e) => setExpenses(onlyDigits(e.target.value))}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t pt-3">
        <span className="font-semibold">= Tiền mặt phải có trong két</span>
        <span className="text-2xl font-extrabold">{formatCurrency(expected)}</span>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="counted-cash" className="text-sm font-semibold">
          Tiền mặt đếm được trong két
        </label>
        <div className="flex items-center rounded-xl border-2 border-primary px-4 focus-within:ring-2 focus-within:ring-primary/30">
          <input
            id="counted-cash"
            autoFocus
            inputMode="numeric"
            placeholder="0"
            value={fmtInput(counted)}
            onChange={(e) => setCounted(onlyDigits(e.target.value))}
            className="w-full bg-transparent py-3 text-right text-3xl font-extrabold tabular-nums outline-none"
          />
          <span className="ml-1 text-2xl font-bold text-muted-foreground">đ</span>
        </div>
      </div>

      <div className={cn('flex items-center justify-center gap-2 rounded-xl p-4 text-xl font-extrabold', counted ? tone.cls : 'bg-muted text-muted-foreground')}>
        {counted ? (
          <>
            <tone.Icon className="h-6 w-6" /> {tone.text}
          </>
        ) : (
          'Nhập số tiền đếm được'
        )}
      </div>

      {counted && diff !== 0 && (
        <Textarea
          rows={2}
          placeholder="Lý do lệch (bắt buộc) — vd: thối nhầm, khách thiếu 2k…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      )}
      {counted && (
        <p className="text-sm text-muted-foreground">
          Để lại {formatCurrency(p.openingCash)} trong két cho ngày mai, nộp{' '}
          <b>{formatCurrency(Math.max(0, countedNum - p.openingCash))}</b> cho chủ tiệm.
        </p>
      )}
      <Button size="lg" className="w-full bg-indigo-600 text-base hover:bg-indigo-700" onClick={confirmSubmit} disabled={submit.isPending}>
        {submit.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <LockKeyhole className="h-5 w-5" />} Chốt két
      </Button>
    </div>
  );
}

function ClosedSummary({ c }: { c: CashClosing }) {
  const t = diffTone(Number(c.difference));
  return (
    <div className="space-y-2 rounded-xl bg-muted/50 p-4">
      <p className="flex items-center gap-2 font-bold">
        <LockKeyhole className="h-5 w-5 text-emerald-600" /> Đã chốt két ngày {dm(c.date)}
      </p>
      <p className="text-sm text-muted-foreground">
        {c.closedBy.name} chốt lúc {formatDateTime(c.createdAt)}
      </p>
      <Line label="Phải có trong két" value={formatCurrency(Number(c.expectedCash))} />
      <Line label="Két đếm được" value={formatCurrency(Number(c.countedCash))} strong />
      <div className={cn('flex items-center justify-center gap-2 rounded-lg p-3 text-lg font-bold', t.cls)}>
        <t.Icon className="h-5 w-5" /> {t.text}
      </div>
      {c.note && <p className="text-sm text-muted-foreground">Lý do: {c.note}</p>}
    </div>
  );
}

/** Sổ chốt két theo tháng — hiện ngay sau khi chốt. Chủ tiệm xoá được để chốt lại. */
export function ClosingBook({ showSummary = false }: { showSummary?: boolean }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [cursor, setCursor] = useState(() => new Date());
  const [openId, setOpenId] = useState<string | null>(null);
  const month = `${cursor.getFullYear()}-${pad2(cursor.getMonth() + 1)}`;
  const query = useQuery({ queryKey: ['cash-closing', 'list', month], queryFn: () => cashClosingApi.list(month) });
  const remove = useMutation({
    mutationFn: (id: string) => cashClosingApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xoá — có thể chốt lại');
      qc.invalidateQueries({ queryKey: ['cash-closing'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });
  const data = query.data;
  const shift = (delta: number) => {
    setOpenId(null);
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-bold">Sổ chốt két</p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shift(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">
            {pad2(cursor.getMonth() + 1)}/{cursor.getFullYear()}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shift(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {query.isLoading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có ngày nào chốt két trong tháng.</p>
      ) : (
        <>
          {showSummary ? (
            <MonthSummary totals={data.totals} />
          ) : (
            <p className="text-xs text-muted-foreground">
              {data.totals.days} ngày · tổng lệch {formatCurrency(data.totals.difference)} ({data.totals.mismatchDays} ngày lệch)
            </p>
          )}
          <div className="space-y-2">
            {data.items.map((c) => {
              const t = diffTone(Number(c.difference));
              const expanded = openId === c.id;
              return (
                <div key={c.id} className="overflow-hidden rounded-lg border">
                  <button
                    type="button"
                    onClick={() => setOpenId(expanded ? null : c.id)}
                    className="flex w-full items-center gap-2 p-3 text-left hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">
                        {dm(c.date)} · {c.closedBy.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Két {formatCurrency(Number(c.countedCash))} / phải có {formatCurrency(Number(c.expectedCash))}
                      </p>
                    </div>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold', t.cls)}>{t.text}</span>
                  </button>
                  {expanded && (
                    <div className="space-y-1 border-t bg-muted/30 p-3">
                      <Line label="Tiền đầu ngày" value={formatCurrency(Number(c.openingCash))} />
                      <Line label="+ Đã thu" value={formatCurrency(Number(c.collected))} />
                      <Line label="− Chuyển khoản" value={formatCurrency(Number(c.transfers))} muted />
                      <Line label="− Chi phí" value={formatCurrency(Number(c.expenses))} muted />
                      <p className="text-xs text-muted-foreground">Chốt lúc {formatDateTime(c.createdAt)}</p>
                      {c.note && <p className="text-sm text-muted-foreground">Lý do: {c.note}</p>}
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-1 border-destructive text-destructive hover:bg-destructive/10"
                          disabled={remove.isPending}
                          onClick={() =>
                            window.confirm(`Xoá lần chốt két ngày ${dm(c.date)}? Nhân viên sẽ chốt lại được ngày này.`) &&
                            remove.mutate(c.id)
                          }
                        >
                          <Trash2 className="h-4 w-4" /> Xoá để chốt lại
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/** Tổng hợp tháng: tổng lệch nổi bật + số ngày, đã thu, chuyển khoản, chi phí */
function MonthSummary({ totals }: { totals: import('@/services/api/cash-closing.api').CashClosingMonth['totals'] }) {
  const t = diffTone(totals.difference);
  return (
    <div className="space-y-3">
      <div className={cn('rounded-xl p-4 text-center', t.cls)}>
        <p className="text-sm font-medium">Tổng lệch trong tháng</p>
        <p className="text-3xl font-extrabold">
          {totals.difference === 0
            ? 'Không lệch'
            : `${totals.difference < 0 ? 'Thiếu' : 'Dư'} ${formatCurrency(Math.abs(totals.difference))}`}
        </p>
        <p className="text-sm">
          {totals.days} ngày đã chốt · {totals.mismatchDays} ngày lệch
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Tổng đã thu', value: totals.collected },
          { label: 'Tổng chuyển khoản', value: totals.transfers },
          { label: 'Tổng chi phí', value: totals.expenses },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-lg font-bold">{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
