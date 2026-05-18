'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { productApi } from '@/services/api/product.api';
import { extractError } from '@/services/api/client';
import {
  productSchema,
  type ProductFormInput,
} from '@/helpers/validators/product.schema';
import type { Product } from '@/types/api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
}

export function ProductFormDialog({ open, onOpenChange, product }: Props) {
  const isEdit = !!product;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', unit: 'cái', price: 0, isActive: true, note: '' },
  });

  useEffect(() => {
    reset({
      name: product?.name ?? '',
      unit: product?.unit ?? 'cái',
      price: product?.price ?? 0,
      isActive: product?.isActive ?? true,
      note: product?.note ?? '',
    });
  }, [product, open, reset]);

  const mutation = useMutation({
    mutationFn: async (values: ProductFormInput) => {
      if (isEdit && product) return productApi.update(product.id, values);
      return productApi.create(values);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm/dịch vụ'}</DialogTitle>
          <DialogDescription>
            Sản phẩm sẽ hiển thị trong picker khi tạo đơn
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Tên *</Label>
            <Input id="name" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="unit">Đơn vị</Label>
              <Input id="unit" placeholder="cái, kg, bộ…" {...register('unit')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Giá *</Label>
              <Input id="price" type="number" min={0} {...register('price')} />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Ghi chú</Label>
            <Textarea id="note" rows={2} {...register('note')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
