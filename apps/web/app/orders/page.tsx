import type { Metadata } from 'next';
import { OrdersPage } from '@/features/orders/components/orders-page';

export const metadata: Metadata = {
  title: 'Orders | E-commerce Platform',
};

export default function OrdersRoutePage() {
  return <OrdersPage />;
}
