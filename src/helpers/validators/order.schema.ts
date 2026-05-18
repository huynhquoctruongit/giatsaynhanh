import { z } from 'zod';

export const orderItemSchema = z.object({
  productId: z.string().uuid().optional(),
  name: z.string().min(1, 'Bắt buộc'),
  quantity: z.coerce.number().int().min(1),
  weight: z.coerce.number().nonnegative().optional(),
  unitPrice: z.coerce.number().nonnegative(),
});

export const orderFormSchema = z.object({
  customerId: z.string().uuid('Chọn khách hàng'),
  note: z.string().optional(),
  pickupAt: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'Đơn phải có ít nhất 1 sản phẩm'),
});

export type OrderFormInput = z.infer<typeof orderFormSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
