import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartItem } from '../../../../core/models/cart.models';
import { CartService } from '../../../../core/services/cart.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ShareModalComponent } from '../../../../shared/components/share-modal/share-modal.component';
// import { CartService } from '../../core/services/cart.service';
// import { CartItem } from '../../core/models/cart.models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, ShareModalComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit {
  items: CartItem[] = [];
  savedItems: CartItem[] = [];
  subtotal = 0;
  itemCount = 0;
  shareModalOpen = false;
  shareTitle = '';
  shareUrl = '';
  private readonly savedStorageKey = 'bazaar.cart.saved';

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

  constructor(
    private cartService: CartService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartService.loadCart().subscribe();
    this.savedItems = this.loadSavedItems();
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
    this.cartService
      .updateItemQuantity(item.product.id, item.quantity + 1)
      .subscribe();
  }

  // Decrease quantity by 1 or remove if 0
  decreaseQty(item: CartItem) {
    if (item.quantity > 1) {
      this.cartService
        .updateItemQuantity(item.product.id, item.quantity - 1)
        .subscribe();
    } else {
      this.deleteItem(item);
    }
  }

  deleteItem(item: CartItem) {
    this.cartService.removeItem(item.product.id).subscribe();
  }

  saveForLater(item: CartItem) {
    this.cartService.removeItem(item.product.id).subscribe({
      next: () => {
        this.savedItems = [...this.savedItems, item];
        this.persistSavedItems();
        this.toastService.info('Moved to Saved for later.');
      },
      error: (err) => {
        const message =
          err?.error?.message || 'Unable to save this item for later.';
        this.toastService.error(message);
      },
    });
  }

  moveToCart(item: CartItem) {
    this.cartService.addItem(item.product, item.quantity).subscribe({
      next: () => {
        this.savedItems = this.savedItems.filter(
          (entry) => entry.product.id !== item.product.id
        );
        this.persistSavedItems();
        this.toastService.success('Moved back to cart.');
      },
      error: (err) => {
        const message =
          err?.error?.message || 'Unable to move item to cart.';
        this.toastService.error(message);
      },
    });
  }

  removeSavedItem(item: CartItem) {
    this.savedItems = this.savedItems.filter(
      (entry) => entry.product.id !== item.product.id
    );
    this.persistSavedItems();
  }

  openShare(item: CartItem) {
    this.shareTitle = item.product.name;
    const baseUrl = window.location.origin;
    this.shareUrl = `${baseUrl}/products/${item.product.id}`;
    this.shareModalOpen = true;
  }

  closeShare() {
    this.shareModalOpen = false;
  }

  proceedToBuy() {
    this.router.navigate(['/checkout']);
  }

  private loadSavedItems(): CartItem[] {
    const stored = localStorage.getItem(this.savedStorageKey);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored) as CartItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private persistSavedItems(): void {
    localStorage.setItem(
      this.savedStorageKey,
      JSON.stringify(this.savedItems)
    );
  }
}
