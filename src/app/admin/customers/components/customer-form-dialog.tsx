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
import { customerApi } from '@/services/api/customer.api';
import { extractError } from '@/services/api/client';
import {
  customerSchema,
  type CustomerFormInput,
} from '@/helpers/validators/customer.schema';
import type { Customer } from '@/types/api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
}

export function CustomerFormDialog({ open, onOpenChange, customer }: Props) {
  const isEdit = !!customer;
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', phone: '', address: '', note: '' },
  });

  useEffect(() => {
    reset({
      name: customer?.name ?? '',
      phone: customer?.phone ?? '',
      address: customer?.address ?? '',
      note: customer?.note ?? '',
    });
  }, [customer, open, reset]);

  const mutation = useMutation({
    mutationFn: async (values: CustomerFormInput) => {
      if (isEdit && customer) return customerApi.update(customer.id, values);
      return customerApi.create(values);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật khách hàng' : 'Đã thêm khách hàng');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      // Đơn & QR hiển thị thông tin khách theo thời gian thực → refresh luôn
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa khách hàng' : 'Thêm khách hàng'}</DialogTitle>
          <DialogDescription>
            Thông tin khách hàng dùng khi tạo đơn giặt sấy
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
          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input id="phone" {...register('phone')} placeholder="Không bắt buộc" />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input id="address" {...register('address')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Ghi chú</Label>
            <Textarea id="note" rows={3} {...register('note')} />
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
