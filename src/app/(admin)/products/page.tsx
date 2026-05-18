'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { productApi } from '@/services/api/product.api';
import { extractError } from '@/services/api/client';
import { formatCurrency } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import type { Product } from '@/types/api';
import { ProductFormDialog } from './components/product-form-dialog';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>();

  const query = useQuery({
    queryKey: ['products', { search: debounced }],
    queryFn: () =>
      productApi.list({ search: debounced || undefined, pageSize: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.remove(id),
    onSuccess: () => {
      toast.success('Đã ẩn sản phẩm');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sản phẩm / Dịch vụ"
        description="Danh sách dịch vụ giặt sấy với giá cố định"
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Thêm sản phẩm
          </Button>
        }
      />

      <Card className="p-4">
        <div className="mb-4 max-w-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Tìm tên sản phẩm…"
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
          <EmptyState
            title="Chưa có sản phẩm"
            description="Tạo sản phẩm để chọn nhanh khi lập đơn"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Đơn vị</TableHead>
                <TableHead className="text-right">Giá</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead className="w-24 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data?.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.unit}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(p.price)}
                  </TableCell>
                  <TableCell>
                    {p.isActive ? (
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                        Ngừng
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {p.note || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(p);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {p.isActive && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Ẩn sản phẩm "${p.name}"?`)) {
                              deleteMutation.mutate(p.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <ProductFormDialog open={open} onOpenChange={setOpen} product={editing} />
    </div>
  );
}
