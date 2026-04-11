import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CheckoutService } from '../../core/services/checkout.service';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import {
  PaymentService,
  RazorpayOptions,
} from '../../core/services/payment.service';
import { CheckoutState } from '../../core/models/checkout.models';
import { OrderTotals } from '../../core/models/cart.models';
import { OrderCreatePayload } from '../../core/models/api.models';

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
  isProcessing = false;
  errorMessage = '';

  constructor(
    private checkoutService: CheckoutService,
    private cartService: CartService,
    private paymentService: PaymentService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
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
    const code = String(this.promoForm.value.code ?? '')
      .trim()
      .toUpperCase();
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

  async payNow(): Promise<void> {
    if (!this.checkoutState || this.isProcessing) return;

    this.isProcessing = true;
    this.errorMessage = '';

    try {
      // Step 1: Create order on backend (you need to implement this endpoint)
      const orderResponse = await this.createOrder();
      const orderId = orderResponse.id;

      // Step 2: Create payment order
      const paymentOrder = await this.paymentService
        .createPaymentOrder(orderId, this.checkoutState.totals.total)
        .toPromise();

      if (!paymentOrder?.data) {
        throw new Error('Failed to create payment order');
      }

      // Step 3: Load Razorpay script
      const scriptLoaded = await this.paymentService.loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Step 4: Get user details
      const user = this.authService.getCurrentUser();
      const address = this.checkoutState.address;

      // Step 5: Open Razorpay checkout
      const options: RazorpayOptions = {
        key: paymentOrder.data.key,
        amount: paymentOrder.data.amount * 100, // In paise
        currency: paymentOrder.data.currency,
        name: 'Bazaar',
        description: 'Order Payment',
        order_id: paymentOrder.data.razorpayOrderId,
        handler: (response) => this.handlePaymentSuccess(response),
        prefill: {
          name: user?.name || address?.fullName || '',
          email: user?.email || '',
          contact: address?.phone || '',
        },
        theme: {
          color: '#0f172a',
        },
      };

      this.paymentService.openRazorpayCheckout(options);
    } catch (error: any) {
      this.isProcessing = false;
      this.errorMessage = error?.message || 'Payment failed. Please try again.';
    }
  }

  private createOrder(): Promise<{ id: string }> {
    if (!this.checkoutState) {
      return Promise.reject(new Error('No checkout state'));
    }

    const address = this.checkoutState.address!;
    const items = this.checkoutState.items.map((item) => ({
      productId: item.product.id || (item.product as any)._id || '',
      quantity: item.quantity,
    }));

    const payload: OrderCreatePayload = {
      items,
      shippingAddress: {
        street:
          address.line1 + (address.line2 ? ', ' + address.line2 : ''),
        city: address.city,
        state: address.state,
        country: 'India',
        zipCode: address.postalCode,
      },
      paymentMethod: this.checkoutState.paymentMethod || 'razorpay',
      paymentProvider: 'razorpay',
    };

    return this.orderService
      .createOrder(payload)
      .toPromise()
      .then((res) => {
        const order = res!.data;
        return { id: order.id || (order as any)._id };
      });
  }

  private handlePaymentSuccess(response: any): void {
    // Verify payment on backend
    this.paymentService
      .verifyPayment({
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      })
      .subscribe({
        next: () => {
          this.isProcessing = false;
          this.cartService.clear();
          this.checkoutService.clear();
          this.router.navigate(['/profile'], {
            queryParams: { paymentSuccess: true },
          });
        },
        error: (err) => {
          this.isProcessing = false;
          this.errorMessage =
            err?.error?.message || 'Payment verification failed';
        },
      });
  }
}
