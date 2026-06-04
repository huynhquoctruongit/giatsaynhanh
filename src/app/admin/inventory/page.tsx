'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import {
  inventoryApi,
  type InventoryItem,
  type InventoryLogType,
} from '@/services/api/inventory.api';
import { extractError } from '@/services/api/client';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'items' | 'logs'>('items');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);

  const [itemOpen, setItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>();
  const [logOpen, setLogOpen] = useState(false);
  const [logTarget, setLogTarget] = useState<InventoryItem | undefined>();

  // Item form
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formMinQuantity, setFormMinQuantity] = useState('');
  const [formImportPrice, setFormImportPrice] = useState('');
  const [formNote, setFormNote] = useState('');

  // Log form
  const [logType, setLogType] = useState<InventoryLogType>('IMPORT');
  const [logQuantity, setLogQuantity] = useState('');
  const [logUnitPrice, setLogUnitPrice] = useState('');
  const [logNote, setLogNote] = useState('');

  const itemsQuery = useQuery({
    queryKey: ['inventory', 'items', { search: debounced }],
    queryFn: () => inventoryApi.items.list({ search: debounced || undefined, pageSize: 100 }),
  });

  const logsQuery = useQuery({
    queryKey: ['inventory', 'logs'],
    queryFn: () => inventoryApi.logs.list({ pageSize: 50 }),
    enabled: tab === 'logs',
  });

  const lowStockQuery = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryApi.lowStock(),
  });

  const createItemMutation = useMutation({
    mutationFn: () =>
      inventoryApi.items.create({
        name: formName,
        unit: formUnit,
        quantity: formQuantity ? Number(formQuantity) : undefined,
        minQuantity: formMinQuantity ? Number(formMinQuantity) : undefined,
        importPrice: formImportPrice ? Number(formImportPrice) : undefined,
        note: formNote || undefined,
      }),
    onSuccess: () => {
      toast.success('Đã thêm mặt hàng');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setItemOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const updateItemMutation = useMutation({
    mutationFn: (id: string) =>
      inventoryApi.items.update(id, {
        name: formName,
        unit: formUnit,
        minQuantity: formMinQuantity ? Number(formMinQuantity) : undefined,
        importPrice: formImportPrice ? Number(formImportPrice) : undefined,
        note: formNote || undefined,
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật mặt hàng');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setItemOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.items.remove(id),
    onSuccess: () => {
      toast.success('Đã xoá mặt hàng');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const createLogMutation = useMutation({
    mutationFn: () =>
      inventoryApi.logs.create({
        itemId: logTarget!.id,
        type: logType,
        quantity: Number(logQuantity),
        unitPrice: logUnitPrice ? Number(logUnitPrice) : undefined,
        note: logNote || undefined,
      }),
    onSuccess: () => {
      toast.success('Đã ghi nhập/xuất kho');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setLogOpen(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  function openCreateItem() {
    setEditingItem(undefined);
    setFormName('');
    setFormUnit('');
    setFormQuantity('');
    setFormMinQuantity('');
    setFormImportPrice('');
    setFormNote('');
    setItemOpen(true);
  }

  function openEditItem(item: InventoryItem) {
    setEditingItem(item);
    setFormName(item.name);
    setFormUnit(item.unit);
    setFormQuantity(item.quantity.toString());
    setFormMinQuantity(item.minQuantity?.toString() ?? '');
    setFormImportPrice(item.importPrice?.toString() ?? '');
    setFormNote(item.note ?? '');
    setItemOpen(true);
  }

  function openLog(item: InventoryItem) {
    setLogTarget(item);
    setLogType('IMPORT');
    setLogQuantity('');
    setLogUnitPrice('');
    setLogNote('');
    setLogOpen(true);
  }

  function handleItemSubmit() {
    if (editingItem) updateItemMutation.mutate(editingItem.id);
    else createItemMutation.mutate();
  }

  const isItemPending = createItemMutation.isPending || updateItemMutation.isPending;
  const lowStockCount = lowStockQuery.data?.length ?? 0;

  const LOG_TYPE_LABEL: Record<InventoryLogType, string> = {
    IMPORT: 'Nhập kho',
    EXPORT: 'Xuất kho',
    ADJUST: 'Điều chỉnh',
  };

  const LOG_TYPE_COLOR: Record<InventoryLogType, string> = {
    IMPORT: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    EXPORT: 'border-rose-200 bg-rose-50 text-rose-700',
    ADJUST: 'border-blue-200 bg-blue-50 text-blue-700',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kho hàng"
        description="Quản lý danh mục hàng hoá và lịch sử nhập xuất"
        actions={
          tab === 'items' && (
            <Button onClick={openCreateItem}>
              <Plus className="h-4 w-4" /> Thêm mặt hàng
            </Button>
          )
        }
      />

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{lowStockCount} mặt hàng</span> sắp hết — cần nhập thêm
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border bg-muted/30 p-1 gap-1">
          <button
            onClick={() => setTab('items')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${tab === 'items' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          >
            Danh sách hàng hoá
          </button>
          <button
            onClick={() => setTab('logs')}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${tab === 'logs' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          >
            Lịch sử nhập xuất
          </button>
        </div>
      </div>

      {tab === 'items' && (
        <Card className="p-4">
          <div className="mb-4">
            <Input
              placeholder="Tìm tên hàng hoá…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {itemsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : itemsQuery.data?.items.length === 0 ? (
            <EmptyState title="Chưa có mặt hàng" description="Thêm mặt hàng để quản lý kho" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead className="text-right">Tồn kho</TableHead>
                  <TableHead className="text-right">Tối thiểu</TableHead>
                  <TableHead className="text-right">Giá nhập</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="w-28 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsQuery.data?.items.map((item) => {
                  const isLow =
                    item.minQuantity != null && item.quantity < item.minQuantity;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className={`text-right font-semibold ${isLow ? 'text-rose-600' : ''}`}>
                        {item.quantity}
                        {isLow && <AlertTriangle className="ml-1 inline h-3.5 w-3.5 text-rose-500" />}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.minQuantity ?? '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.importPrice != null ? formatCurrency(item.importPrice) : '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {item.note || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Nhập/Xuất kho" onClick={() => openLog(item)}>
                            <ArrowDownToLine className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditItem(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Xoá "${item.name}"?`)) deleteItemMutation.mutate(item.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {tab === 'logs' && (
        <Card className="p-4">
          {logsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logsQuery.data?.items.length === 0 ? (
            <EmptyState title="Chưa có giao dịch kho" description="Nhập/xuất kho từ danh sách hàng hoá" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Mặt hàng</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsQuery.data?.items.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell className="font-medium">{log.item?.name ?? log.itemId}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${LOG_TYPE_COLOR[log.type]}`}>
                        {log.type === 'IMPORT' && <ArrowDownToLine className="mr-1 h-3 w-3" />}
                        {log.type === 'EXPORT' && <ArrowUpFromLine className="mr-1 h-3 w-3" />}
                        {LOG_TYPE_LABEL[log.type]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {log.type === 'EXPORT' ? '-' : '+'}{log.quantity} {log.item?.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.unitPrice != null ? formatCurrency(log.unitPrice) : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {log.note || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Item dialog */}
      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Sửa mặt hàng' : 'Thêm mặt hàng'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Bột giặt Omo" />
            </div>
            <div className="space-y-2">
              <Label>Đơn vị *</Label>
              <Input value={formUnit} onChange={(e) => setFormUnit(e.target.value)} placeholder="kg, gói, chai…" />
            </div>
            {!editingItem && (
              <div className="space-y-2">
                <Label>Số lượng ban đầu</Label>
                <Input type="number" value={formQuantity} onChange={(e) => setFormQuantity(e.target.value)} placeholder="0" min={0} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Tồn kho tối thiểu</Label>
              <Input type="number" value={formMinQuantity} onChange={(e) => setFormMinQuantity(e.target.value)} placeholder="5" min={0} />
            </div>
            <div className="space-y-2">
              <Label>Giá nhập (VND)</Label>
              <Input type="number" value={formImportPrice} onChange={(e) => setFormImportPrice(e.target.value)} placeholder="50000" min={0} />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Input value={formNote} onChange={(e) => setFormNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setItemOpen(false)}>Huỷ</Button>
            <Button onClick={handleItemSubmit} disabled={isItemPending || !formName || !formUnit}>
              {isItemPending ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log dialog */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nhập/Xuất kho — {logTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tồn kho hiện tại: <span className="font-semibold text-foreground">{logTarget?.quantity} {logTarget?.unit}</span>
            </p>
            <div className="space-y-2">
              <Label>Loại</Label>
              <Select value={logType} onValueChange={(v) => setLogType(v as InventoryLogType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMPORT">Nhập kho</SelectItem>
                  <SelectItem value="EXPORT">Xuất kho</SelectItem>
                  <SelectItem value="ADJUST">Điều chỉnh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Số lượng *</Label>
              <Input type="number" value={logQuantity} onChange={(e) => setLogQuantity(e.target.value)} placeholder="10" min={1} />
            </div>
            <div className="space-y-2">
              <Label>Đơn giá (VND)</Label>
              <Input type="number" value={logUnitPrice} onChange={(e) => setLogUnitPrice(e.target.value)} placeholder="50000" min={0} />
            </div>
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <Input value={logNote} onChange={(e) => setLogNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLogOpen(false)}>Huỷ</Button>
            <Button onClick={() => createLogMutation.mutate()} disabled={createLogMutation.isPending || !logQuantity}>
              {createLogMutation.isPending ? 'Đang lưu…' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
