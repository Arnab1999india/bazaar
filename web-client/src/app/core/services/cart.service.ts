import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, OrderTotals } from '../models/cart.models';
import { Product } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  readonly cartItems$ = this.cartItemsSubject.asObservable();

  addItem(product: Product, quantity = 1): void {
    const items = [...this.cartItemsSubject.value];
    const existing = items.find((item) => item.product.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ product, quantity });
    }
    this.cartItemsSubject.next(items);
  }

  removeItem(productId: string): void {
    const next = this.cartItemsSubject.value.filter(
      (item) => item.product.id !== productId
    );
    this.cartItemsSubject.next(next);
  }

  clear(): void {
    this.cartItemsSubject.next([]);
  }

  getCount(): number {
    return this.cartItemsSubject.value.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }

  getItems(): CartItem[] {
    return [...this.cartItemsSubject.value];
  }

  getTotals(deliveryCharge = 40, discount = 0): OrderTotals {
    const subtotal = this.cartItemsSubject.value.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
    const total = subtotal + deliveryCharge - discount;
    return { subtotal, deliveryCharge, discount, total };
  }
}
