export interface CartItem {
  id: string;
  imageUrl?: string;
  name: string;
  price: number;
  productId: string;
  quantity: number;
  slug?: string;
  variantId: string;
  variantName?: string;
}

export interface CartSummary {
  currency: string;
  discountTotal: number;
  itemCount: number;
  shippingTotal: number;
  subtotal: number;
  taxTotal: number;
  total: number;
}

export interface Cart {
  id?: string;
  items: CartItem[];
  summary: CartSummary;
}
