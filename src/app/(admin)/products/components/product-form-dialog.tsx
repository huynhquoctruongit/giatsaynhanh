'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PlusIcon, Trash2Icon } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
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

const DEFAULT_TIERS = [
  { minQty: 1, price: 0 },
  { minQty: 5, price: 0 },
  { minQty: 10, price: 0 },
];

export function ProductFormDialog({ open, onOpenChange, product }: Props) {
  const isEdit = !!product;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      unit: 'cái',
      price: 0,
      wholesaleEnabled: false,
      wholesaleTiers: DEFAULT_TIERS,
      isActive: true,
      note: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'wholesaleTiers',
  });

  const wholesaleEnabled = watch('wholesaleEnabled');

  useEffect(() => {
    reset({
      name: product?.name ?? '',
      unit: product?.unit ?? 'cái',
      price: product?.price ?? 0,
      wholesaleEnabled: product?.wholesaleEnabled ?? false,
      wholesaleTiers:
        product?.wholesaleTiers && product.wholesaleTiers.length > 0
          ? product.wholesaleTiers
          : DEFAULT_TIERS,
      isActive: product?.isActive ?? true,
      note: product?.note ?? '',
    });
  }, [product, open, reset]);

  const mutation = useMutation({
    mutationFn: async (values: ProductFormInput) => {
      // Nếu không bật giá sỉ, gửi tiers = null
      const payload = {
        ...values,
        wholesaleTiers: values.wholesaleEnabled ? (values.wholesaleTiers ?? null) : null,
      };
      if (isEdit && product) return productApi.update(product.id, payload);
      return productApi.create(payload);
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
      <DialogContent className="max-w-lg">
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
          {/* Tên */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên *</Label>
            <Input id="name" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Đơn vị + Giá lẻ */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="unit">Đơn vị</Label>
              <Input id="unit" placeholder="cái, kg, bộ…" {...register('unit')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Giá lẻ *</Label>
              <Input id="price" type="number" min={0} {...register('price')} />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>
          </div>

          {/* Bán sỉ toggle */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="wholesaleEnabled"
              checked={wholesaleEnabled ?? false}
              onCheckedChange={(checked) =>
                setValue('wholesaleEnabled', checked === true)
              }
            />
            <Label htmlFor="wholesaleEnabled" className="cursor-pointer font-medium">
              Bán sỉ (giảm giá theo số lượng)
            </Label>
          </div>

          {/* Tiers — chỉ hiện khi bật bán sỉ */}
          {wholesaleEnabled && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
                <span>Số lượng tối thiểu</span>
                <span>Giá / đơn vị</span>
                <span />
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <Input
                    type="number"
                    min={1}
                    placeholder="SL từ…"
                    {...register(`wholesaleTiers.${index}.minQty`)}
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Giá…"
                    {...register(`wholesaleTiers.${index}.price`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {fields.length < 6 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => append({ minQty: 1, price: 0 })}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Thêm mức giá
                </Button>
              )}
              <p className="text-xs text-muted-foreground px-1">
                Ví dụ: từ 5 cái → 15.000đ/cái, từ 10 cái → 12.000đ/cái. Nếu không khớp → áp dụng giá lẻ.
              </p>
            </div>
          )}

          {/* Ghi chú */}
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
