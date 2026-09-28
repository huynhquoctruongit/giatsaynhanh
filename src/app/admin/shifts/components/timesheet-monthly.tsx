'use client';

import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { timesheetApi, type TimesheetUser } from '@/services/api/timesheet.api';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const pad2 = (n: number) => n.toString().padStart(2, '0');
const monthKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const money = (v: number) => v.toLocaleString('vi-VN') + 'đ';
const hours = (v: number) => `${v.toLocaleString('vi-VN')}h`;

/** Thống kê chấm công (nút nổi trên app) theo tháng. ADMIN thấy mọi nhân viên, STAFF chỉ thấy mình. */
export function TimesheetMonthly() {
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
        <CardTitle className="text-base">Chấm công theo tháng</CardTitle>
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
            <div className="flex flex-wrap items-end gap-8">
              <div>
                <p className="text-xs text-muted-foreground">Tổng giờ</p>
                <p className="text-2xl font-bold">{hours(data.totalHours)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tổng lương</p>
                <p className="text-2xl font-bold text-emerald-600">{money(data.totalAmount)}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Ngày thường {money(data.rates.weekday)}/giờ · Chủ nhật {money(data.rates.sunday)}/giờ ·
                Giờ vào/ra làm tròn 30 phút gần nhất
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead className="text-right">Số ca</TableHead>
                  <TableHead className="text-right">Tổng giờ</TableHead>
                  <TableHead className="text-right">Lương</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((u) => (
                  <UserRows key={u.userId} user={u} defaultOpen={data.users.length === 1} />
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function UserRows({ user, defaultOpen }: { user: TimesheetUser; defaultOpen: boolean }) {
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
              <TableCell />
            </TableRow>
          );
        })}
    </Fragment>
  );
}
