import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CheckoutService } from '../../core/services/checkout.service';
import { CartService } from '../../core/services/cart.service';
import { CheckoutState } from '../../core/models/checkout.models';
import { OrderTotals } from '../../core/models/cart.models';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
})
export class PaymentComponent implements OnInit {
  checkoutState: CheckoutState | null = null;
  promoForm: FormGroup;
  message = '';

  constructor(
    private checkoutService: CheckoutService,
    private cartService: CartService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.promoForm = this.fb.group({
      code: [''],
    });
  }

  ngOnInit(): void {
    this.checkoutState = this.checkoutService.getState();
    if (!this.checkoutState) {
      this.router.navigate(['/checkout']);
    }
  }

  applyPromo(): void {
    if (!this.checkoutState) return;
    const code = String(this.promoForm.value.code ?? '').trim().toUpperCase();
    let discount = 0;
    if (code === 'SAVE50') {
      discount = 50;
      this.message = 'Promo applied: ₹50 off';
    } else if (code === 'BAZAAR10') {
      discount = Math.round(this.checkoutState.totals.subtotal * 0.1);
      this.message = 'Promo applied: 10% off';
    } else {
      this.message = 'Invalid promo code.';
    }

    const totals: OrderTotals = {
      ...this.checkoutState.totals,
      discount,
      total:
        this.checkoutState.totals.subtotal +
        this.checkoutState.totals.deliveryCharge -
        discount,
    };
    this.checkoutService.updateTotals(totals, code || undefined);
    this.checkoutState = this.checkoutService.getState();
  }

  payNow(): void {
    this.cartService.clear();
    this.checkoutService.clear();
    this.router.navigate(['/profile']);
  }
}
