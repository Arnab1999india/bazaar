import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../core/models/api.models';
import { WishlistService } from '../../core/services/wishlist.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent implements OnInit, OnDestroy {
  @Input() product!: Product;
  @Output() view = new EventEmitter<Product>();
  @Output() addToCart = new EventEmitter<Product>();
  @Output() buyNow = new EventEmitter<Product>();

  isWishlisted = false;
  private wishSub?: Subscription;

  constructor(private wishlistService: WishlistService) {}

  ngOnInit(): void {
    this.wishSub = this.wishlistService.getWishlistIds().subscribe((ids) => {
      this.isWishlisted = ids.includes(this.product?.id || (this.product as any)?._id || '');
    });
  }

  ngOnDestroy(): void {
    this.wishSub?.unsubscribe();
  }

  toggleWishlist(event: Event): void {
    event.stopPropagation();
    const id = this.product?.id || (this.product as any)?._id;
    if (id) this.wishlistService.toggleWishlist(id);
  }

  isOutOfStock(): boolean {
    if (this.product.stockStatus === 'out-of-stock') return true;
    if (this.product.totalStock !== undefined && this.product.totalStock <= 0) return true;
    return false;
  }

  getStockText(): string {
    return this.isOutOfStock() ? 'Out of Stock' : 'In Stock';
  }
}
