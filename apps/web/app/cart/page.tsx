import type { Metadata } from 'next';
import { CartPage } from '@/features/cart/components/cart-page';

export const metadata: Metadata = {
  title: 'Cart | E-commerce Platform',
};

export default function Page() {
  return <CartPage />;
}
