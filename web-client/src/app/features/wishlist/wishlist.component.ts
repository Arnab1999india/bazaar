import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { Product } from '../../core/models/api.models';

interface WishlistItem {
  id: string;
  product: Product;
  addedDate: Date;
  priority: 'low' | 'medium' | 'high';
  wants: number;
  hasDeal: boolean;
  dealPercent?: number;
  ratingCount: number;
}

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss',
})
export class WishlistComponent implements OnInit {
  searchQuery = '';
  sortOption = 'date-desc'; // Default: Most recently added

  // Master list
  wishlistItems: WishlistItem[] = [];
  // Display list (filtered/sorted)
  displayedItems: WishlistItem[] = [];

  constructor(
    private cartService: CartService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMockData();
    this.filterAndSort();
  }

  loadMockData() {
    this.wishlistItems = [
      {
        id: 'w1',
        addedDate: new Date('2026-01-13'),
        priority: 'high',
        wants: 1,
        hasDeal: true,
        dealPercent: 69,
        ratingCount: 490,
        product: {
          id: 'p1',
          name: 'Kratos Mobile Holder for Bike with One-Touch Lock, 360° Rotating Adjustable Phone Mount',
          brand: 'Kratos (Unknown Binding)',
          price: 499,
          category: 'Electronics',
          description: 'Heavy Duty Shockproof Mobile Stand',
          imageUrl: ['https://via.placeholder.com/200x200?text=Mobile+Holder'],
          rating: 4.5,
          stockStatus: 'in-stock',
        },
      },
      {
        id: 'w2',
        addedDate: new Date('2026-01-09'),
        priority: 'medium',
        wants: 1,
        hasDeal: false,
        ratingCount: 11,
        product: {
          id: 'p2',
          name: 'EvaRiya (Pack of 2 Ready-to-Wear Cotton Ikkat Blouse for Women | Pre-Stitched Saree Blouse',
          brand: 'EvaRiya',
          price: 999,
          category: 'Fashion',
          description: 'Stylish, Comfortable Day Wear',
          imageUrl: ['https://via.placeholder.com/200x200?text=Blouse'],
          rating: 3.5,
          stockStatus: 'in-stock',
        },
      },
    ];
  }

  filterAndSort() {
    let temp = [...this.wishlistItems];

    // 1. Search Filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      temp = temp.filter(
        (item) =>
          item.product.name.toLowerCase().includes(q) ||
          item.product.brand.toLowerCase().includes(q)
      );
    }

    // 2. Sorting
    switch (this.sortOption) {
      case 'date-desc':
        temp.sort((a, b) => b.addedDate.getTime() - a.addedDate.getTime());
        break;
      case 'date-asc':
        temp.sort((a, b) => a.addedDate.getTime() - b.addedDate.getTime());
        break;
      case 'price-low':
        temp.sort((a, b) => a.product.price - b.product.price);
        break;
      case 'price-high':
        temp.sort((a, b) => b.product.price - a.product.price);
        break;
      case 'priority':
        const pMap = { high: 3, medium: 2, low: 1 };
        temp.sort((a, b) => pMap[b.priority] - pMap[a.priority]);
        break;
    }

    this.displayedItems = temp;
  }

  addToCart(item: WishlistItem) {
    if (item.product.stockStatus === 'out-of-stock') {
      this.toastService.info('This product is currently out of stock.');
      return;
    }
    this.cartService.addItem(item.product, 1).subscribe({
      next: () => {
        this.toastService.success('Added to cart.');
      },
      error: (err) => {
        const message =
          err?.error?.message || 'Unable to add the product to cart.';
        this.toastService.error(message);
      },
    });
    // Optional: Show toast or feedback
  }

  deleteItem(id: string) {
    if (confirm('Remove this item from the list?')) {
      this.wishlistItems = this.wishlistItems.filter((i) => i.id !== id);
      this.filterAndSort();
    }
  }

  // Helpers for template
  getOriginalPrice(price: number, discount: number): number {
    return Math.round(price * (100 / (100 - discount)));
  }
}
