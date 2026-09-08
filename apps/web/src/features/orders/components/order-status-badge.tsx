import { Badge } from '@/shared/ui/badge';
import type { FulfillmentStatus, OrderStatus, PaymentStatus } from '../types';

interface OrderStatusBadgeProps {
  status: FulfillmentStatus | OrderStatus | PaymentStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const variant =
    status === 'CANCELLED' || status === 'FAILED'
      ? 'destructive'
      : status === 'COMPLETED' || status === 'PAID' || status === 'DELIVERED'
        ? 'success'
        : status === 'PENDING' || status === 'PENDING_PAYMENT' || status === 'UNPAID'
          ? 'warning'
          : 'secondary';

  return <Badge variant={variant}>{getStatusLabel(status)}</Badge>;
}

function getStatusLabel(status: FulfillmentStatus | OrderStatus | PaymentStatus) {
  return status
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}
