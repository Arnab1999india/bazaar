import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../core/models/api.models';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() view = new EventEmitter<Product>();
  @Output() addToCart = new EventEmitter<Product>();
  @Output() buyNow = new EventEmitter<Product>();

  isOutOfStock(): boolean {
    // Check stockStatus field
    if (this.product.stockStatus === 'out-of-stock') {
      return true;
    }

    // Check totalStock field
    if (this.product.totalStock !== undefined && this.product.totalStock <= 0) {
      return true;
    }

    return false;
  }

  // ✅ NEW: Get stock status text
  getStockText(): string {
    return this.isOutOfStock() ? 'Out of Stock' : 'In Stock';
  }
}
