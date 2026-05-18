import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Bắt buộc'),
  unit: z.string().min(1).default('cái'),
  price: z.coerce.number().nonnegative('Giá phải >= 0'),
  isActive: z.boolean().optional().default(true),
  note: z.string().optional(),
});

export type ProductFormInput = z.infer<typeof productSchema>;
