import { cn } from '@/lib/utils';
import {
  ORDER_STATUS_COLOR,
  ORDER_STATUS_LABEL,
  type OrderStatus,
} from '@/helpers/enums/order-status';

interface Props {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        ORDER_STATUS_COLOR[status],
        className,
      )}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
