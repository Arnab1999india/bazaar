import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { StoreService } from '../../../../core/services/store.service';
import { CatalogService } from '../../../../core/services/catalog.service';
import { Product } from '../../../../core/models/api.models';

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seller-products.component.html',
  styleUrl: './seller-products.component.scss',
})
export class SellerProductsComponent implements OnInit {
  products: Product[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private storeService: StoreService,
    private catalogService: CatalogService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user?.id) {
      this.errorMessage = 'Please sign in to view your products.';
      this.isLoading = false;
      return;
    }

    this.storeService
      .getStoreProducts(user.id, { sort: 'createdAt', page: 1, limit: 50 })
      .subscribe({
        next: (response) => {
          this.products = response.data ?? [];
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage =
            err?.error?.message ||
            'Unable to load your products right now.';
        },
      });
  }

  stockLabel(product: Product): string {
    if (typeof product.totalStock === 'number') {
      return String(product.totalStock);
    }
    if (product.stockStatus) {
      return product.stockStatus === 'in-stock'
        ? 'In stock'
        : 'Out of stock';
    }
    return 'N/A';
  }

  editProduct(productId: string): void {
    this.router.navigate(['/seller/products', productId, 'edit']);
  }

  deleteProduct(productId: string): void {
    if (!confirm('Delete this product?')) {
      return;
    }
    this.catalogService.deleteProduct(productId).subscribe({
      next: () => {
        this.products = this.products.filter((product) => product.id !== productId);
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          'Unable to delete the product right now.';
      },
    });
  }
}
