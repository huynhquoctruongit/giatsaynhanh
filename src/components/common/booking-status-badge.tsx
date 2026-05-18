import { cn } from '@/lib/utils';
import {
  BOOKING_STATUS_COLOR,
  BOOKING_STATUS_LABEL,
  type BookingStatus,
} from '@/helpers/enums/booking-status';

interface Props {
  status: BookingStatus;
  className?: string;
}

export function BookingStatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        BOOKING_STATUS_COLOR[status],
        className,
      )}
    >
      {BOOKING_STATUS_LABEL[status]}
    </span>
  );
}
