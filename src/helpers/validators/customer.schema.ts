import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Bắt buộc'),
  // SĐT không bắt buộc — cho phép rỗng; nếu có thì kiểm tra định dạng
  phone: z
    .string()
    .max(20)
    .regex(/^[0-9+()\-\s]*$/, 'Số điện thoại không hợp lệ')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),
  note: z.string().optional(),
});

export type CustomerFormInput = z.infer<typeof customerSchema>;
