import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CheckoutState, DeliveryAddress } from '../models/checkout.models';
import { CartItem, OrderTotals } from '../models/cart.models';

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly stateSubject = new BehaviorSubject<CheckoutState | null>(null);
  readonly state$ = this.stateSubject.asObservable();

  setState(items: CartItem[], totals: OrderTotals, address: DeliveryAddress | null) {
    this.stateSubject.next({ items, totals, address });
  }

  updateTotals(totals: OrderTotals, promoCode?: string): void {
    const current = this.stateSubject.value;
    if (!current) return;
    this.stateSubject.next({ ...current, totals, promoCode });
  }

  getState(): CheckoutState | null {
    return this.stateSubject.value;
  }

  clear(): void {
    this.stateSubject.next(null);
  }
}
