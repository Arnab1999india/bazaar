import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CheckoutService } from '../../core/services/checkout.service';
import { CartService } from '../../core/services/cart.service';
import { PaymentService } from '../../core/services/payment.service';
import { OrderService } from '../../core/services/order.service';
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
    private paymentService: PaymentService,
    private orderService: OrderService,
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
    if (!this.checkoutState?.address) {
      this.message = 'Missing delivery address.';
      return;
    }
    if (this.checkoutState.paymentMethod !== 'razorpay') {
      this.message = 'Only Razorpay is supported right now.';
      return;
    }

    this.paymentService
      .createRazorpayOrder(this.checkoutState.totals.total)
      .subscribe({
        next: (res) => {
          this.openRazorpayCheckout(res.data);
        },
        error: () => {
          this.message = 'Unable to start payment.';
        },
      });
  }

  private openRazorpayCheckout(order: {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  }): void {
    this.loadRazorpayScript().then((loaded) => {
      if (!loaded) {
        this.message = 'Razorpay script failed to load.';
        return;
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Bazaar',
        description: 'Order payment',
        order_id: order.orderId,
        handler: (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          this.verifyAndPlaceOrder(response);
        },
        modal: {
          ondismiss: () => {
            this.message = 'Payment cancelled.';
          },
        },
        prefill: {
          name: this.checkoutState?.address?.fullName,
          contact: this.checkoutState?.address?.phone,
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    });
  }

  private verifyAndPlaceOrder(response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): void {
    if (!this.checkoutState?.address) {
      this.message = 'Missing delivery address.';
      return;
    }

    this.paymentService
      .verifyRazorpayPayment({
        orderId: response.razorpay_order_id,
        paymentId: response.razorpay_payment_id,
        signature: response.razorpay_signature,
      })
      .subscribe({
        next: () => {
          const address = this.checkoutState!.address!;
          this.orderService
            .createOrder({
              shippingAddress: {
                street: address.line1,
                city: address.city,
                state: address.state,
                country: 'India',
                zipCode: address.postalCode,
              },
              paymentMethod: 'razorpay',
              paymentProvider: 'razorpay',
              paymentId: response.razorpay_payment_id,
              paymentSignature: response.razorpay_signature,
              razorpayOrderId: response.razorpay_order_id,
            })
            .subscribe({
              next: () => {
                this.cartService.clear().subscribe();
                this.checkoutService.clear();
                this.router.navigate(['/profile']);
              },
              error: () => {
                this.message = 'Payment verified, but order failed to create.';
              },
            });
        },
        error: () => {
          this.message = 'Payment verification failed.';
        },
      });
  }

  private loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }
}
