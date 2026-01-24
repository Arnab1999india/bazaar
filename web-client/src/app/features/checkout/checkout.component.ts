import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { CheckoutService } from '../../core/services/checkout.service';
import { CartItem, OrderTotals } from '../../core/models/cart.models';
import { DeliveryAddress } from '../../core/models/checkout.models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  items: CartItem[] = [];
  totals: OrderTotals = {
    subtotal: 0,
    deliveryCharge: 40,
    discount: 0,
    total: 0,
  };

  // Addresses
  defaultAddress: DeliveryAddress | null = null;
  savedAddresses: DeliveryAddress[] = []; // Mock data for "Change Address"
  isChangingAddress = false;

  // Payment
  selectedPaymentMethod = 'razorpay'; // Default
  walletBalance = 55.0; // Mock balance
  useWallet = false;

  constructor(
    private cartService: CartService,
    private checkoutService: CheckoutService,
    private router: Router
  ) {
    // Mock Data for Address
    this.savedAddresses = [
      {
        fullName: 'Arnab Adak',
        line1: 'Hira House, Canal Bank Road',
        line2: 'Salun Gardakhin Para, Gauranga Nagar',
        city: 'KOLKATA',
        state: 'WEST BENGAL',
        postalCode: '700102',
        phone: '9876543210',
      },
      {
        fullName: 'Arnab Adak (Work)',
        line1: 'Tech Park, Sector V',
        city: 'KOLKATA',
        state: 'WEST BENGAL',
        postalCode: '700091',
        phone: '9876543210',
      },
    ];
    this.defaultAddress = this.savedAddresses[0];
  }

  ngOnInit(): void {
    this.cartService.loadCart().subscribe();
    this.cartService.cartItems$.subscribe((items) => {
      this.items = items;
      this.computeTotals();
    });

    if (this.items.length === 0) {
      // Redirect or show empty state if needed
      // this.router.navigate(['/products']);
    }
  }

  // --- Quantity Logic ---
  increaseQty(item: CartItem) {
    this.cartService
      .updateItemQuantity(item.product.id, item.quantity + 1)
      .subscribe();
  }

  decreaseQty(item: CartItem) {
    if (item.quantity > 1) {
      this.cartService
        .updateItemQuantity(item.product.id, item.quantity - 1)
        .subscribe();
    } else {
      this.cartService.removeItem(item.product.id).subscribe();
    }
  }

  private computeTotals() {
    const subtotal = this.items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
    const deliveryCharge = subtotal > 499 ? 0 : 40; // Free delivery logic
    const discount = 0; // Can add promo logic here

    // Adjust total if wallet is used
    let payAmount = subtotal + deliveryCharge - discount;
    if (this.useWallet) {
      // Logic: if wallet has enough, payAmount becomes 0 (or partial)
      // For UI simplicity, we just show the calculation in total
    }

    this.totals = {
      subtotal,
      deliveryCharge,
      discount,
      total: payAmount,
    };
  }

  // --- Payment Logic ---
  toggleWallet(event: any) {
    this.useWallet = event.target.checked;
    this.computeTotals();
  }

  selectPaymentMethod(method: string) {
    this.selectedPaymentMethod = method;
  }

  changeAddress() {
    this.isChangingAddress = !this.isChangingAddress;
  }

  selectAddress(addr: DeliveryAddress) {
    this.defaultAddress = addr;
    this.isChangingAddress = false;
  }

  placeOrder() {
    if (!this.defaultAddress) {
      alert('Please select a delivery address.');
      return;
    }

    this.checkoutService.setState(
      this.items,
      this.totals,
      this.defaultAddress,
      this.selectedPaymentMethod
    );
    this.router.navigate(['/payment']);
  }
}
