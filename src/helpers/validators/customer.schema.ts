import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Bắt buộc'),
  phone: z
    .string()
    .min(8, 'Số điện thoại tối thiểu 8 ký tự')
    .max(20)
    .regex(/^[0-9+()\-\s]+$/, 'Số điện thoại không hợp lệ'),
  address: z.string().optional(),
  note: z.string().optional(),
});

export type CustomerFormInput = z.infer<typeof customerSchema>;
