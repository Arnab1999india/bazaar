import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '../../core/services/catalog.service';
import { CartService } from '../../core/services/cart.service';
import { CheckoutService } from '../../core/services/checkout.service';
import { CartItem, OrderTotals } from '../../core/models/cart.models';
import { Product } from '../../core/models/api.models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  addressForm: FormGroup;
  items: CartItem[] = [];
  totals: OrderTotals = {
    subtotal: 0,
    deliveryCharge: 40,
    discount: 0,
    total: 0,
  };
  isLoading = true;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private catalogService: CatalogService,
    private cartService: CartService,
    private checkoutService: CheckoutService
  ) {
    this.addressForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s-]+$/)]],
      line1: ['', [Validators.required]],
      line2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.queryParamMap.get('productId');
    if (productId) {
      this.catalogService.getProduct(productId).subscribe({
        next: (res) => {
          this.items = [{ product: res.data, quantity: 1 }];
          this.totals = this.computeTotals(this.items);
          this.isLoading = false;
        },
        error: () => {
          const demo = this.demoProduct(productId);
          this.items = [{ product: demo, quantity: 1 }];
          this.totals = this.computeTotals(this.items);
          this.isLoading = false;
          this.errorMessage = 'Showing demo product for checkout.';
        },
      });
      return;
    }

    this.items = this.cartService.getItems();
    this.totals = this.computeTotals(this.items);
    this.isLoading = false;
    if (!this.items.length) {
      this.errorMessage = 'Your cart is empty. Add products to continue.';
    }
  }

  continueToPayment(): void {
    if (!this.items.length) return;
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.checkoutService.setState(this.items, this.totals, this.addressForm.value);
    this.router.navigate(['/payment']);
  }

  private computeTotals(items: CartItem[]): OrderTotals {
    const subtotal = items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
    const deliveryCharge = 40;
    const discount = 0;
    return {
      subtotal,
      deliveryCharge,
      discount,
      total: subtotal + deliveryCharge - discount,
    };
  }

  private demoProduct(productId: string): Product {
    return {
      id: productId,
      name: 'Demo Checkout Item',
      price: 2999,
      category: 'electronics',
      brand: 'bazaar',
      description: 'Checkout demo item when API is unavailable.',
      imageUrl: ['https://via.placeholder.com/420x320?text=Checkout+Item'],
    };
  }
}
