'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { customerApi } from '@/services/api/customer.api';
import { extractError } from '@/services/api/client';
import { formatDate } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import type { Customer } from '@/types/api';
import { CustomerFormDialog } from './components/customer-form-dialog';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | undefined>();

  const query = useQuery({
    queryKey: ['customers', { search: debounced }],
    queryFn: () => customerApi.list({ search: debounced || undefined, pageSize: 50 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xoá khách hàng');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Khách hàng"
        description="Quản lý danh sách khách hàng"
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Thêm khách
          </Button>
        }
      />

      <Card className="p-4">
        <div className="mb-4 flex gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Tìm tên, số điện thoại…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : query.data?.items.length === 0 ? (
          <EmptyState title="Chưa có khách hàng" description="Bấm Thêm khách để bắt đầu" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead>Tạo lúc</TableHead>
                <TableHead className="w-24 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data?.items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell className="max-w-xs truncate">{c.address || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {c.note || '-'}
                  </TableCell>
                  <TableCell>{formatDate(c.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(c);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Xoá khách ${c.name}?`)) {
                            deleteMutation.mutate(c.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <CustomerFormDialog open={open} onOpenChange={setOpen} customer={editing} />
    </div>
  );
}
