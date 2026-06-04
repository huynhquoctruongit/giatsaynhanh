'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { BookingStatusBadge } from '@/components/common/booking-status-badge';
import { bookingApi } from '@/services/api/booking.api';
import { formatDateTime } from '@/lib/utils';
import {
  BOOKING_STATUS_LABEL,
  type BookingStatus,
} from '@/helpers/enums/booking-status';
import { useDebounce } from '@/hooks/use-debounce';

const ALL = '__ALL__';

export default function BookingsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [status, setStatus] = useState<string>(ALL);

  const query = useQuery({
    queryKey: ['bookings', { search: debounced, status }],
    queryFn: () =>
      bookingApi.list({
        search: debounced || undefined,
        status: status === ALL ? undefined : (status as BookingStatus),
        pageSize: 50,
      }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đặt lịch"
        description="Yêu cầu đặt lại đơn giặt sấy do khách quét QR gửi về"
      />

      <Card className="p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Tìm mã đặt lịch, tên khách, SĐT, địa chỉ…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tất cả trạng thái</SelectItem>
              {(Object.keys(BOOKING_STATUS_LABEL) as BookingStatus[]).map(
                (s) => (
                  <SelectItem key={s} value={s}>
                    {BOOKING_STATUS_LABEL[s]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        {query.isLoading ? (
          <div className="relative flex min-h-[240px] items-center justify-center rounded-lg bg-muted/20">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Đang tải đặt lịch…</p>
            </div>
          </div>
        ) : query.data?.items.length === 0 ? (
          <EmptyState
            title="Chưa có yêu cầu đặt lịch nào"
            description="Khi khách quét QR trên hoá đơn và bấm đặt lại, yêu cầu sẽ hiển thị ở đây."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đặt lịch</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Hẹn lấy / giao</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Gửi lúc</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data?.items.map((b) => (
                <TableRow
                  key={b.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/admin/bookings/${b.id}`)}
                >
                  <TableCell className="font-mono text-sm font-semibold text-primary">
                    {b.code}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{b.customer?.name ?? '-'}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {b.address}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{b.phone}</p>
                    {b.sourceOrder && (
                      <p className="text-xs text-muted-foreground">
                        Từ đơn{' '}
                        <span className="font-mono">{b.sourceOrder.code}</span>
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    <p>Lấy: {formatDateTime(b.pickupAt)}</p>
                    <p className="text-muted-foreground">
                      Giao: {formatDateTime(b.deliveryAt)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <BookingStatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(b.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
