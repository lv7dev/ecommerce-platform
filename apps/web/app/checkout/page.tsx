import type { Metadata } from 'next';
import { CheckoutPage } from '@/features/orders/components/checkout-page';

export const metadata: Metadata = {
  title: 'Checkout | E-commerce Platform',
};

export default function CheckoutRoutePage() {
  return <CheckoutPage />;
}
