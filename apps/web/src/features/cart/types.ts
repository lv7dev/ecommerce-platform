export interface AddCartItemInput {
  quantity: number;
  variantId: string;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export interface MergeCartItemInput {
  quantity: number;
  variantId: string;
}

export interface MergeCartInput {
  items: MergeCartItemInput[];
}

export interface QuoteCartInput {
  currency?: string;
  items: MergeCartItemInput[];
}

export interface CartItemOptionValue {
  optionCode: string;
  optionName: string;
  valueCode: string;
  valueName: string;
}

export interface CartItem {
  availableStock: number;
  createdAt: string;
  currency?: string;
  id: string;
  imageUrl: string | null;
  isAvailable: boolean;
  lineTotalMinor: string | null;
  optionValues: CartItemOptionValue[];
  productId: string;
  productName: string;
  quantity: number;
  reservedStock: number;
  sku: string;
  stock: number;
  unavailableReason: string | null;
  unitAmountMinor: string | null;
  updatedAt: string;
  variantId: string;
  variantName: string | null;
}

export interface Cart {
  createdAt: string;
  currency: string;
  id: string;
  items: CartItem[];
  subtotalMinor: string;
  updatedAt: string;
  userId: string;
}
