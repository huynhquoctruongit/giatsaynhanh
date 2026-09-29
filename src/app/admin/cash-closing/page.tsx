'use client';

import { Fragment, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LockKeyhole,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { cashClosingApi, type CashClosing } from '@/services/api/cash-closing.api';
import { extractError } from '@/services/api/client';
import { useAuth } from '@/hooks/use-auth';
import { cn, formatCurrency, formatDateTime } from '@/lib/utils';

const pad2 = (n: number) => n.toString().padStart(2, '0');
const dm = (date: string) => date.split('-').reverse().slice(0, 2).join('/');
const denomLabel = (d: number) => (d >= 1000 ? `${d / 1000}k` : `${d}đ`);

function diffTone(diff: number) {
  if (diff === 0) return { cls: 'bg-emerald-50 text-emerald-700', text: 'Két khớp', Icon: CheckCircle2 };
  if (diff < 0) return { cls: 'bg-rose-50 text-rose-700', text: `Thiếu ${formatCurrency(-diff)}`, Icon: AlertCircle };
  return { cls: 'bg-amber-50 text-amber-800', text: `Dư ${formatCurrency(diff)}`, Icon: AlertTriangle };
}

function Line({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className={cn('text-sm text-muted-foreground', strong && 'font-semibold text-foreground')}>{label}</span>
      <span className={cn('font-medium', muted && 'text-muted-foreground', strong && 'text-lg font-bold')}>{value}</span>
    </div>
  );
}

function ClosingLines({ c }: { c: CashClosing }) {
  return (
    <>
      <Line label="Tiền đầu ngày" value={formatCurrency(Number(c.openingCash))} />
      <Line label="+ Đã thu" value={formatCurrency(Number(c.collected))} />
      <Line label="− Chuyển khoản" value={formatCurrency(Number(c.transfers))} muted />
      {Number(c.expenses) > 0 && (
        <Line
          label={`− Chi phí${c.expenseNote ? ` (${c.expenseNote})` : ''}`}
          value={formatCurrency(Number(c.expenses))}
          muted
        />
      )}
      <Line label="= Phải có trong két" value={formatCurrency(Number(c.expectedCash))} strong />
      <Line label="Két đếm được" value={formatCurrency(Number(c.countedCash))} strong />
    </>
  );
}

/** Chốt két hôm nay — hệ thống tự tính tiền phải có, nhân viên đếm theo mệnh giá. */
function TodayClosing() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['cash-closing', 'preview'], queryFn: () => cashClosingApi.preview() });
  const p = query.data;

  const [counts, setCounts] = useState<Record<string, string>>({});
  const [expenses, setExpenses] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [note, setNote] = useState('');

  const expenseNum = Number(expenses) || 0;
  const counted = useMemo(
    () => (p?.denominations ?? []).reduce((s, d) => s + d * (Number(counts[String(d)]) || 0), 0),
    [p, counts],
  );
  const expected = (p?.expectedBeforeExpenses ?? 0) - expenseNum;
  const diff = counted - expected;
  const tone = diffTone(diff);

  const submit = useMutation({
    mutationFn: () =>
      cashClosingApi.create({
        denominations: Object.fromEntries((p?.denominations ?? []).map((d) => [String(d), Number(counts[String(d)]) || 0])),
        expenses: expenseNum,
        expenseNote: expenseNote.trim() || undefined,
        note: note.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Đã chốt két — đã báo chủ tiệm');
      qc.invalidateQueries({ queryKey: ['cash-closing'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  if (query.isLoading || !p) return <Skeleton className="h-96 w-full" />;

  if (p.closing) {
    const c = p.closing;
    const t = diffTone(Number(c.difference));
    return (
      <Card className="max-w-xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <LockKeyhole className="h-5 w-5 text-emerald-600" /> Đã chốt két ngày {dm(c.date)}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {c.closedBy.name} chốt lúc {formatDateTime(c.createdAt)}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <ClosingLines c={c} />
          </div>
          <div className={cn('flex items-center justify-center gap-2 rounded-xl p-4 text-lg font-bold', t.cls)}>
            <t.Icon className="h-6 w-6" /> {t.text}
          </div>
          {c.note && <p className="text-sm text-muted-foreground">Lý do: {c.note}</p>}
        </CardContent>
      </Card>
    );
  }

  const confirmSubmit = () => {
    if (diff !== 0 && !note.trim()) {
      toast.error('Két lệch tiền — vui lòng ghi lý do');
      return;
    }
    if (
      window.confirm(
        `Chốt két hôm nay?\nKét đếm ${formatCurrency(counted)} — ${tone.text.toLowerCase()}.\nSau khi chốt sẽ không sửa được (chỉ chủ tiệm xoá để chốt lại).`,
      )
    ) {
      submit.mutate();
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Chốt két ngày {dm(p.date)}</CardTitle>
          <Button variant="ghost" size="icon" title="Tải lại số liệu" onClick={() => query.refetch()}>
            <RefreshCw className={cn('h-4 w-4', query.isRefetching && 'animate-spin')} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-1">
          <Line label="Tiền đầu ngày" value={formatCurrency(p.openingCash)} />
          <Line label={`+ Đã thu (${p.orderCount} đơn)`} value={formatCurrency(p.collected)} />
          <Line label={`− Chuyển khoản (${p.transferCount} GD)`} value={formatCurrency(p.transfers)} muted />
          <div className="flex items-center justify-between gap-4 py-1">
            <span className="text-sm text-muted-foreground">− Chi phí (đá, cf ông Địa…)</span>
            <Input
              className="w-36 text-right"
              inputMode="numeric"
              placeholder="0"
              value={expenses ? Number(expenses).toLocaleString('vi-VN') : ''}
              onChange={(e) => setExpenses(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          {expenseNum > 0 && (
            <Input
              placeholder="Chi cho việc gì? (vd: mua đá 15k, cf ông Địa 10k)"
              value={expenseNote}
              onChange={(e) => setExpenseNote(e.target.value)}
            />
          )}
          <div className="my-2 border-t" />
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold">= Tiền mặt phải có trong két</span>
            <span className="text-2xl font-extrabold">{formatCurrency(expected)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Đếm tiền mặt trong két</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
            {p.denominations.map((d) => {
              const n = Number(counts[String(d)]) || 0;
              return (
                <div key={d} className="flex items-center gap-2">
                  <span className="w-12 font-bold">{denomLabel(d)}</span>
                  <span className="text-muted-foreground">×</span>
                  <Input
                    className="w-20 text-center"
                    inputMode="numeric"
                    placeholder="0"
                    value={counts[String(d)] ?? ''}
                    onChange={(e) => setCounts((c) => ({ ...c, [String(d)]: e.target.value.replace(/\D/g, '') }))}
                  />
                  <span className="min-w-0 flex-1 whitespace-nowrap text-right text-sm text-muted-foreground">{n ? formatCurrency(d * n) : ''}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Két đếm được</span>
              <span className="text-2xl font-extrabold">{formatCurrency(counted)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3 lg:col-span-2">
        <div className={cn('flex items-center justify-center gap-2 rounded-xl p-5 text-2xl font-extrabold', tone.cls)}>
          <tone.Icon className="h-7 w-7" /> {tone.text}
        </div>
        {diff !== 0 && (
          <Textarea
            rows={2}
            placeholder="Lý do lệch (bắt buộc) — vd: thối nhầm, khách thiếu 2k…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        )}
        <p className="text-sm text-muted-foreground">
          Sau khi chốt, để lại {formatCurrency(p.openingCash)} trong két cho ngày mai, nộp{' '}
          <b>{formatCurrency(Math.max(0, counted - p.openingCash))}</b> cho chủ tiệm.
        </p>
        <Button size="lg" className="w-full sm:w-auto" onClick={confirmSubmit} disabled={submit.isPending}>
          <LockKeyhole className="h-4 w-4" /> {submit.isPending ? 'Đang chốt…' : 'Chốt két'}
        </Button>
      </div>
    </div>
  );
}

/** ADMIN — sổ chốt két theo tháng */
function ClosingHistory() {
  const qc = useQueryClient();
  const [cursor, setCursor] = useState(() => new Date());
  const [openId, setOpenId] = useState<string | null>(null);
  const month = `${cursor.getFullYear()}-${pad2(cursor.getMonth() + 1)}`;
  const query = useQuery({ queryKey: ['cash-closing', 'list', month], queryFn: () => cashClosingApi.list(month) });
  const remove = useMutation({
    mutationFn: (id: string) => cashClosingApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xoá — nhân viên có thể chốt lại');
      qc.invalidateQueries({ queryKey: ['cash-closing'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });
  const data = query.data;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
        <CardTitle className="text-lg">Sổ chốt két</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-28 text-center text-sm font-semibold">
            Tháng {pad2(cursor.getMonth() + 1)}/{cursor.getFullYear()}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {query.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="Chưa có ngày nào chốt két trong tháng" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: 'Đã chốt', value: `${data.totals.days} ngày` },
                { label: 'Tổng đã thu', value: formatCurrency(data.totals.collected) },
                { label: 'Tổng chuyển khoản', value: formatCurrency(data.totals.transfers) },
                {
                  label: `Chênh lệch (${data.totals.mismatchDays} ngày lệch)`,
                  value: formatCurrency(data.totals.difference),
                  tone: data.totals.difference < 0 ? 'text-rose-600' : data.totals.difference > 0 ? 'text-amber-600' : 'text-emerald-600',
                },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={cn('text-lg font-bold', s.tone)}>{s.value}</p>
                </div>
              ))}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead className="text-right">Đã thu</TableHead>
                  <TableHead className="text-right">Chuyển khoản</TableHead>
                  <TableHead className="text-right">Phải có</TableHead>
                  <TableHead className="text-right">Két đếm</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((c) => {
                  const t = diffTone(Number(c.difference));
                  const open = openId === c.id;
                  return (
                    <Fragment key={c.id}>
                      <TableRow className="cursor-pointer" onClick={() => setOpenId(open ? null : c.id)}>
                        <TableCell className="font-semibold">{dm(c.date)}</TableCell>
                        <TableCell>{c.closedBy.name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(c.collected))}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(Number(c.transfers))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(c.expectedCash))}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(Number(c.countedCash))}</TableCell>
                        <TableCell>
                          <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', t.cls)}>{t.text}</span>
                        </TableCell>
                        <TableCell>{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</TableCell>
                      </TableRow>
                      {open && (
                        <TableRow>
                          <TableCell colSpan={8} className="bg-muted/30">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <ClosingLines c={c} />
                                {c.note && <p className="mt-2 text-sm text-muted-foreground">Lý do lệch: {c.note}</p>}
                              </div>
                              <div className="space-y-2 text-sm">
                                <p className="font-semibold">Đếm theo mệnh giá</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                  {Object.entries(c.denominations)
                                    .filter(([, n]) => n > 0)
                                    .sort(([a], [b]) => Number(b) - Number(a))
                                    .map(([d, n]) => (
                                      <span key={d}>
                                        {denomLabel(Number(d))} × {n} = {formatCurrency(Number(d) * n)}
                                      </span>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">Chốt lúc {formatDateTime(c.createdAt)}</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-destructive text-destructive hover:bg-destructive/10"
                                  disabled={remove.isPending}
                                  onClick={() =>
                                    window.confirm(`Xoá lần chốt két ngày ${dm(c.date)}? Nhân viên sẽ chốt lại được ngày này.`) &&
                                    remove.mutate(c.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" /> Xoá để chốt lại
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function CashClosingPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  return (
    <div className="space-y-6">
      <PageHeader
        title="Chốt két"
        description="Cuối ngày đếm tiền mặt trong két — hệ thống tự tính số phải có và báo chủ tiệm"
      />
      <TodayClosing />
      {isAdmin && <ClosingHistory />}
    </div>
  );
}
