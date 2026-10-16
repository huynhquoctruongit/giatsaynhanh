'use client';

import { Fragment, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { extractError } from '@/services/api/client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import {
  timesheetApi,
  type TimesheetEntry,
  type TimesheetUser,
  type TimesheetWeek,
} from '@/services/api/timesheet.api';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const pad2 = (n: number) => n.toString().padStart(2, '0');
const monthKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
// <input type="datetime-local"> dùng giờ địa phương "YYYY-MM-DDTHH:mm"
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const money = (v: number) => v.toLocaleString('vi-VN') + 'đ';
/** "2026-10-05" → "05/10" */
const ddmm = (ymd: string) => `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`;
const todayYmd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const hours = (v: number) => `${v.toLocaleString('vi-VN')}h`;

/** Thống kê chấm công (nút nổi trên app) theo tháng. ADMIN thấy mọi nhân viên, STAFF chỉ thấy mình. */
export function TimesheetMonthly() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [editing, setEditing] = useState<{ entry: TimesheetEntry; name: string } | null>(null);
  const [cursor, setCursor] = useState(() => new Date());
  const month = monthKey(cursor);
  const shiftMonth = (delta: number) =>
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));

  const { data, isLoading } = useQuery({
    queryKey: ['timesheet', 'monthly', month],
    queryFn: () => timesheetApi.monthly(month),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
        <CardTitle className="text-base">Lương theo tuần</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-28 text-center text-sm font-semibold">
            Tháng {pad2(cursor.getMonth() + 1)}/{cursor.getFullYear()}
          </span>
          <Button variant="outline" size="icon" onClick={() => shiftMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : !data || data.users.length === 0 ? (
          <EmptyState title="Chưa có ca nào trong tháng này" description="Nhân viên chấm công bằng nút tròn trên app" />
        ) : (
          <>
            {/* Tổng tháng = cộng các tuần lương (tuần thuộc tháng có ngày Chủ nhật cuối tuần) */}
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Tổng giờ tháng</p>
                  <p className="text-2xl font-bold">{hours(data.totalHours)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tổng lương tháng</p>
                  <p className="text-2xl font-bold text-emerald-600">{money(data.totalAmount)}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.weeks.length} tuần · {ddmm(data.from)} – {ddmm(data.to)}
                </p>
              </div>
              {data.users.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.users.map((u) => (
                    <span key={u.userId} className="rounded-full border bg-background px-3 py-1 text-sm">
                      {u.name}: <b>{hours(u.totalHours)}</b> ·{' '}
                      <b className="text-emerald-600">{money(u.totalAmount)}</b>
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Ngày thường {money(data.rates.weekday)}/giờ · Chủ nhật {money(data.rates.sunday)}/giờ ·
                Giờ vào/ra làm tròn 30 phút gần nhất · Tuần tính từ Thứ 2 đến Chủ nhật
              </p>
            </div>

            {data.weeks.map((w, idx) => (
              <WeekBlock
                key={w.start}
                week={w}
                index={data.weeks.length - idx}
                onEdit={isAdmin ? (entry, name) => setEditing({ entry, name }) : undefined}
              />
            ))}
          </>
        )}
      </CardContent>
      {editing && (
        <EditEntryDialog entry={editing.entry} name={editing.name} onClose={() => setEditing(null)} />
      )}
    </Card>
  );
}

/** ADMIN sửa giờ vào/ra hoặc xoá 1 ca chấm công. */
function EditEntryDialog({ entry, name, onClose }: { entry: TimesheetEntry; name: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [checkIn, setCheckIn] = useState(toLocalInput(entry.checkIn));
  const [checkOut, setCheckOut] = useState(entry.checkOut ? toLocalInput(entry.checkOut) : '');
  const [open, setOpen] = useState(!entry.checkOut);

  const done = (msg: string) => {
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ['timesheet'] });
    onClose();
  };
  const save = useMutation({
    mutationFn: () =>
      timesheetApi.update(entry.id, {
        checkIn: new Date(checkIn).toISOString(),
        checkOut: open ? null : new Date(checkOut).toISOString(),
      }),
    onSuccess: () => done('Đã sửa ca chấm công'),
    onError: (err) => toast.error(extractError(err).message),
  });
  const remove = useMutation({
    mutationFn: () => timesheetApi.remove(entry.id),
    onSuccess: () => done('Đã xoá ca chấm công'),
    onError: (err) => toast.error(extractError(err).message),
  });
  const invalid = !checkIn || (!open && (!checkOut || new Date(checkOut) <= new Date(checkIn)));

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa ca chấm công — {name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Giờ vào ca</Label>
            <Input type="datetime-local" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Giờ kết ca</Label>
            <Input
              type="datetime-local"
              value={checkOut}
              disabled={open}
              onChange={(e) => setCheckOut(e.target.value)}
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={open} onCheckedChange={setOpen} /> Chưa kết ca (đang làm)
            </label>
            {!open && checkOut && checkIn && new Date(checkOut) <= new Date(checkIn) && (
              <p className="text-xs text-destructive">Giờ kết ca phải sau giờ vào ca</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Giờ tính lương vẫn làm tròn 30 phút gần nhất.</p>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            disabled={remove.isPending}
            onClick={() => window.confirm(`Xoá ca chấm công này của ${name}?`) && remove.mutate()}
          >
            <Trash2 className="h-4 w-4" /> Xoá ca
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Huỷ</Button>
            <Button onClick={() => save.mutate()} disabled={invalid || save.isPending}>
              {save.isPending ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** 1 tuần lương = 1 block riêng: tổng tuần + từng nhân viên (bấm để xem từng ca). */
function WeekBlock({
  week,
  index,
  onEdit,
}: {
  week: TimesheetWeek;
  index: number;
  onEdit?: (entry: TimesheetEntry, name: string) => void;
}) {
  const today = todayYmd();
  const isCurrent = week.start <= today && today <= week.end;
  return (
    <div className={cn('overflow-hidden rounded-xl border', isCurrent && 'border-primary/60 ring-1 ring-primary/20')}>
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3',
          isCurrent ? 'bg-primary/5' : 'bg-muted/40',
        )}
      >
        <div className="flex items-center gap-2">
          <p className="font-semibold">
            Tuần {index}: {ddmm(week.start)} – {ddmm(week.end)}
          </p>
          {isCurrent && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
              Tuần này
            </span>
          )}
        </div>
        <p className="text-sm">
          <span className="text-muted-foreground">{hours(week.totalHours)} · </span>
          <span className="text-base font-bold text-emerald-600">{money(week.totalAmount)}</span>
        </p>
      </div>
      {week.users.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">Chưa có ca nào trong tuần này</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhân viên</TableHead>
              <TableHead className="text-right">Số ca</TableHead>
              <TableHead className="text-right">Tổng giờ</TableHead>
              <TableHead className="text-right">Lương tuần</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {week.users.map((u) => (
              <UserRows
                key={u.userId}
                user={u}
                defaultOpen={week.users.length === 1}
                onEdit={onEdit ? (entry) => onEdit(entry, u.name) : undefined}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function UserRows({
  user,
  defaultOpen,
  onEdit,
}: {
  user: TimesheetUser;
  defaultOpen: boolean;
  onEdit?: (entry: TimesheetEntry) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Fragment>
      <TableRow className="cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <TableCell className="font-medium">{user.name}</TableCell>
        <TableCell className="text-right">{user.entries.length}</TableCell>
        <TableCell className="text-right">{hours(user.totalHours)}</TableCell>
        <TableCell className="text-right font-semibold text-emerald-600">{money(user.totalAmount)}</TableCell>
        <TableCell>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </TableCell>
      </TableRow>
      {open &&
        user.entries.map((e) => {
          const d = new Date(e.checkIn);
          return (
            <TableRow key={e.id} className={cn('text-sm', e.isSunday && 'bg-amber-50')}>
              <TableCell className="pl-8">
                <span className={cn('font-medium', e.isSunday && 'text-amber-700')}>
                  {WEEKDAYS[d.getDay()]} {pad2(d.getDate())}/{pad2(d.getMonth() + 1)}
                </span>
                <span className="ml-3">
                  {hhmm(e.roundedIn)} – {e.roundedOut ? hhmm(e.roundedOut) : '…'}
                </span>
                <span className="ml-3 text-xs text-muted-foreground">
                  (bấm {hhmm(e.checkIn)} – {e.checkOut ? hhmm(e.checkOut) : 'đang làm'})
                </span>
              </TableCell>
              <TableCell />
              <TableCell className="text-right">
                {e.roundedOut ? `${hours(e.hours)} × ${e.rate / 1000}k` : ''}
              </TableCell>
              <TableCell className="text-right">
                {e.roundedOut ? money(e.amount) : <span className="text-emerald-600">Đang làm</span>}
              </TableCell>
              <TableCell>
                {onEdit && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Sửa / xoá ca" onClick={() => onEdit(e)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
    </Fragment>
  );
}
