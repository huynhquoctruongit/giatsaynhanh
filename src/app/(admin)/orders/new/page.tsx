'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/common/page-header';
import { customerApi } from '@/services/api/customer.api';
import { productApi } from '@/services/api/product.api';
import { orderApi } from '@/services/api/order.api';
import { extractError } from '@/services/api/client';
import { formatCurrency } from '@/lib/utils';
import {
  orderFormSchema,
  type OrderFormInput,
} from '@/helpers/validators/order.schema';

export default function NewOrderPage() {
  const router = useRouter();

  const customersQuery = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: () => customerApi.list({ pageSize: 100 }),
  });

  const productsQuery = useQuery({
    queryKey: ['products', 'active'],
    queryFn: () => productApi.list({ isActive: true, pageSize: 100 }),
  });

  const form = useForm<OrderFormInput>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerId: '',
      note: '',
      pickupAt: '',
      items: [{ name: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { control, register, handleSubmit, setValue, watch, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');
  const total = items.reduce(
    (sum, i) => sum + Number(i.quantity || 0) * Number(i.unitPrice || 0),
    0,
  );

  const mutation = useMutation({
    mutationFn: (values: OrderFormInput) =>
      orderApi.create({
        customerId: values.customerId,
        note: values.note || undefined,
        pickupAt: values.pickupAt || undefined,
        items: values.items.map((i) => ({
          productId: i.productId || undefined,
          name: i.name,
          quantity: Number(i.quantity),
          weight: i.weight ? Number(i.weight) : undefined,
          unitPrice: Number(i.unitPrice),
        })),
      }),
    onSuccess: (order) => {
      toast.success(`Tạo đơn ${order.code} thành công`);
      router.push(`/orders/${order.id}`);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const onPickProduct = (index: number, productId: string) => {
    const product = productsQuery.data?.items.find((p) => p.id === productId);
    if (!product) return;
    setValue(`items.${index}.productId`, product.id);
    setValue(`items.${index}.name`, product.name);
    setValue(`items.${index}.unitPrice`, product.price);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tạo đơn giặt sấy"
        description="Chọn khách, thêm sản phẩm và in QR"
        actions={
          <Button variant="ghost" asChild>
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4" /> Danh sách đơn
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin chung</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Khách hàng *</Label>
              <Select
                value={watch('customerId') || undefined}
                onValueChange={(v) =>
                  setValue('customerId', v, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  {customersQuery.data?.items.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formState.errors.customerId && (
                <p className="text-xs text-destructive">
                  {formState.errors.customerId.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Chưa có khách?{' '}
                <Link href="/customers" className="text-primary underline">
                  Thêm khách mới
                </Link>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickupAt">Hẹn lấy đồ (tuỳ chọn)</Label>
              <Input id="pickupAt" type="datetime-local" {...register('pickupAt')} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Textarea id="note" rows={2} {...register('note')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Danh sách sản phẩm</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: '', quantity: 1, unitPrice: 0 })}
            >
              <Plus className="h-4 w-4" /> Thêm dòng
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((field, index) => {
              const row = items[index];
              const subtotal =
                Number(row?.quantity || 0) * Number(row?.unitPrice || 0);
              return (
                <div
                  key={field.id}
                  className="grid grid-cols-12 items-end gap-2 rounded-lg border p-3"
                >
                  <div className="col-span-12 space-y-1 md:col-span-3">
                    <Label className="text-xs">Sản phẩm</Label>
                    <Select
                      value={row?.productId || undefined}
                      onValueChange={(v) => onPickProduct(index, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn từ danh sách" />
                      </SelectTrigger>
                      <SelectContent>
                        {productsQuery.data?.items.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({formatCurrency(p.price)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-12 space-y-1 md:col-span-3">
                    <Label className="text-xs">Tên hiển thị *</Label>
                    <Input {...register(`items.${index}.name`)} />
                  </div>
                  <div className="col-span-4 space-y-1 md:col-span-1">
                    <Label className="text-xs">SL *</Label>
                    <Input
                      type="number"
                      min={1}
                      {...register(`items.${index}.quantity`)}
                    />
                  </div>
                  <div className="col-span-4 space-y-1 md:col-span-2">
                    <Label className="text-xs">Cân nặng (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min={0}
                      {...register(`items.${index}.weight`)}
                    />
                  </div>
                  <div className="col-span-4 space-y-1 md:col-span-2">
                    <Label className="text-xs">Đơn giá *</Label>
                    <Input
                      type="number"
                      min={0}
                      {...register(`items.${index}.unitPrice`)}
                    />
                  </div>
                  <div className="col-span-12 flex items-center justify-between md:col-span-1 md:justify-end">
                    <p className="text-sm font-medium md:hidden">
                      {formatCurrency(subtotal)}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fields.length > 1 && remove(index)}
                      disabled={fields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                  <div className="hidden md:col-span-12 md:flex md:justify-end">
                    <p className="text-sm font-medium">{formatCurrency(subtotal)}</p>
                  </div>
                </div>
              );
            })}
            {formState.errors.items && (
              <p className="text-xs text-destructive">
                {formState.errors.items.message ?? 'Cần ít nhất 1 sản phẩm'}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col items-end gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tổng tiền</p>
            <p className="text-2xl font-bold">{formatCurrency(total)}</p>
          </div>
          <Button type="submit" size="lg" disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang tạo…' : 'Tạo đơn & in QR'}
          </Button>
        </div>
      </form>
    </div>
  );
}
