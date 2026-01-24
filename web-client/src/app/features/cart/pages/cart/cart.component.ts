import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartItem } from '../../../../core/models/cart.models';
import { CartService } from '../../../../core/services/cart.service';
// import { CartService } from '../../core/services/cart.service';
// import { CartItem } from '../../core/models/cart.models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit {
  items: CartItem[] = [];
  subtotal = 0;
  itemCount = 0;

  // Mock data for "Related Products" sidebar
  relatedProducts = [
    {
      name: 'Kratos 2026, Premium Bike Mount',
      rating: 4.5,
      ratingCount: 2660,
      price: 599,
      image: 'https://via.placeholder.com/150?text=Mount',
    },
    {
      name: 'HOKIPO Large Foldable Mat',
      rating: 4,
      ratingCount: 39,
      price: 917,
      image: 'https://via.placeholder.com/150?text=Mat',
    },
    {
      name: 'UltraProlink Snap-Z Selfie Stick',
      rating: 4.5,
      ratingCount: 1499,
      price: 1499,
      image: 'https://via.placeholder.com/150?text=Stick',
    },
  ];

  constructor(private cartService: CartService, private router: Router) {}

  ngOnInit(): void {
    // Subscribe to cart changes to update UI automatically
    this.cartService.cartItems$.subscribe((items) => {
      this.items = items;
      this.calculateTotals();
    });
  }

  calculateTotals() {
    this.itemCount = this.items.reduce((acc, item) => acc + item.quantity, 0);
    this.subtotal = this.items.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );
  }

  // Increase quantity by 1
  increaseQty(item: CartItem) {
    this.cartService.addItem(item.product, 1);
  }

  // Decrease quantity by 1 or remove if 0
  decreaseQty(item: CartItem) {
    if (item.quantity > 1) {
      this.cartService.addItem(item.product, -1);
    } else {
      this.deleteItem(item);
    }
  }

  deleteItem(item: CartItem) {
    this.cartService.removeItem(item.product.id);
  }

  proceedToBuy() {
    this.router.navigate(['/checkout']);
  }
}
