import { CartItem, OrderTotals } from './cart.models';

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface CheckoutState {
  items: CartItem[];
  address: DeliveryAddress | null;
  totals: OrderTotals;
  promoCode?: string;
}
