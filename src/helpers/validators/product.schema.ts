import { z } from 'zod';

const wholesaleTierSchema = z.object({
  minQty: z.coerce.number().int().min(1, 'Tối thiểu 1'),
  price: z.coerce.number().nonnegative('Giá phải >= 0'),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Bắt buộc'),
  unit: z.string().min(1).default('cái'),
  price: z.coerce.number().nonnegative('Giá phải >= 0'),
  wholesaleEnabled: z.boolean().optional().default(false),
  wholesaleTiers: z.array(wholesaleTierSchema).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  hiddenFromBooking: z.boolean().optional().default(false),
  note: z.string().optional(),
});

export type ProductFormInput = z.infer<typeof productSchema>;
