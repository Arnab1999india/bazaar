import { Product } from './api.models';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderTotals {
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
}
