'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Clock, LogIn, LogOut, Plus, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { shiftApi } from '@/services/api/shift.api';
import { extractError } from '@/services/api/client';
import { useAuth } from '@/hooks/use-auth';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function ShiftsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [openShiftOpen, setOpenShiftOpen] = useState(false);
  const [shiftName, setShiftName] = useState('');
  const [shiftNote, setShiftNote] = useState('');
  const [closeNote, setCloseNote] = useState('');
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  const currentQuery = useQuery({
    queryKey: ['shifts', 'current'],
    queryFn: () => shiftApi.current(),
    refetchInterval: 30_000,
  });

  const historyQuery = useQuery({
    queryKey: ['shifts', 'history'],
    queryFn: () => shiftApi.list({ isOpen: false, pageSize: 20 }),
  });

  const openShiftMutation = useMutation({
    mutationFn: () => shiftApi.create({ name: shiftName, note: shiftNote || undefined }),
    onSuccess: () => {
      toast.success('Đã mở ca làm việc');
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setOpenShiftOpen(false);
      setShiftName('');
      setShiftNote('');
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const closeShiftMutation = useMutation({
    mutationFn: () => shiftApi.close(currentQuery.data!.id, { note: closeNote || undefined }),
    onSuccess: () => {
      toast.success('Đã đóng ca làm việc');
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setCloseConfirmOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const checkInMutation = useMutation({
    mutationFn: () => shiftApi.checkIn(currentQuery.data!.id, { userId: user!.id }),
    onSuccess: () => {
      toast.success('Đã check-in ca làm việc');
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const checkOutMutation = useMutation({
    mutationFn: (attendanceId: string) =>
      shiftApi.checkOut(currentQuery.data!.id, attendanceId),
    onSuccess: () => {
      toast.success('Đã check-out ca làm việc');
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const currentShift = currentQuery.data;
  const myAttendance = currentShift?.attendance.find(
    (a) => a.userId === user?.id && !a.checkOut,
  );
  const isCheckedIn = !!myAttendance;

  function durationLabel(shift: { openedAt: string; closedAt: string | null }) {
    const start = new Date(shift.openedAt);
    const end = shift.closedAt ? new Date(shift.closedAt) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const h = Math.floor(diffMs / 3_600_000);
    const m = Math.floor((diffMs % 3_600_000) / 60_000);
    return `${h}g ${m}p`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ca làm việc"
        description="Quản lý ca làm việc và điểm danh nhân viên"
        actions={
          !currentShift && !currentQuery.isLoading ? (
            <Button onClick={() => setOpenShiftOpen(true)}>
              <Plus className="h-4 w-4" /> Mở ca mới
            </Button>
          ) : undefined
        }
      />

      {/* Current shift card */}
      {currentQuery.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : currentShift ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                <Clock className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-base">{currentShift.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Mở lúc {formatDateTime(currentShift.openedAt)} · {durationLabel(currentShift)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isCheckedIn ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => checkInMutation.mutate()}
                  disabled={checkInMutation.isPending}
                >
                  <LogIn className="h-4 w-4" /> Check-in
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => checkOutMutation.mutate(myAttendance!.id)}
                  disabled={checkOutMutation.isPending}
                >
                  <LogOut className="h-4 w-4" /> Check-out
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setCloseConfirmOpen(true)}
              >
                Đóng ca
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm font-medium">Nhân viên trong ca ({currentShift.attendance.length})</p>
            {currentShift.attendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có ai check-in</p>
            ) : (
              <div className="space-y-2">
                {currentShift.attendance.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{a.user?.name ?? a.userId}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(a.checkIn)}
                      {a.checkOut && <> → {formatDateTime(a.checkOut)}</>}
                      {!a.checkOut && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                          Đang làm
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <Clock className="h-10 w-10 text-muted-foreground" />
            <p className="text-center text-muted-foreground">Hiện không có ca nào đang mở</p>
            <Button onClick={() => setOpenShiftOpen(true)}>
              <Plus className="h-4 w-4" /> Mở ca mới
            </Button>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Lịch sử ca làm việc</h2>
        <Card className="p-4">
          {historyQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : historyQuery.data?.items.length === 0 ? (
            <EmptyState title="Chưa có ca cũ" description="Lịch sử sẽ hiển thị sau khi đóng ca" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên ca</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Thời lượng</TableHead>
                  <TableHead className="text-right">Số nhân viên</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyQuery.data?.items.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{formatDate(s.openedAt)}</TableCell>
                    <TableCell>{durationLabel(s)}</TableCell>
                    <TableCell className="text-right">{s.attendance.length}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{s.note || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Open shift dialog */}
      <Dialog open={openShiftOpen} onOpenChange={setOpenShiftOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mở ca làm việc mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên ca *</Label>
              <Input
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                placeholder="Ca sáng, Ca chiều…"
              />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Input value={shiftNote} onChange={(e) => setShiftNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenShiftOpen(false)}>Huỷ</Button>
            <Button
              onClick={() => openShiftMutation.mutate()}
              disabled={openShiftMutation.isPending || !shiftName}
            >
              {openShiftMutation.isPending ? 'Đang mở…' : 'Mở ca'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close confirm dialog */}
      <Dialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận đóng ca</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Bạn sắp đóng ca <span className="font-semibold text-foreground">{currentShift?.name}</span>.
              Tất cả nhân viên chưa check-out sẽ được tự động check-out.
            </p>
            <div className="space-y-2">
              <Label>Ghi chú khi đóng ca</Label>
              <Input value={closeNote} onChange={(e) => setCloseNote(e.target.value)} placeholder="Tuỳ chọn" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCloseConfirmOpen(false)}>Huỷ</Button>
            <Button
              variant="destructive"
              onClick={() => closeShiftMutation.mutate()}
              disabled={closeShiftMutation.isPending}
            >
              {closeShiftMutation.isPending ? 'Đang đóng…' : 'Đóng ca'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
