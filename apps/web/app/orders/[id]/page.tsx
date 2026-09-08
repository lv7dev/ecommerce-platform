import type { Metadata } from 'next';
import { OrderDetailPage } from '@/features/orders/components/order-detail-page';

export const metadata: Metadata = {
  title: 'Order Detail | E-commerce Platform',
};

interface OrderDetailRoutePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailRoutePage({ params }: OrderDetailRoutePageProps) {
  const { id } = await params;

  return <OrderDetailPage orderId={id} />;
}
