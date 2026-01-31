import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/api.models';
import { ProductCardComponent } from '../../../shared/product-card/product-card.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private catalogService: CatalogService,
    private cartService: CartService,
    private authService: AuthService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.isLoading = true;
      this.catalogService
        .listProducts({
          q: params['q'],
          category: params['category'],
          brand: params['brand'],
          sort: params['sort'],
        })
        .subscribe({
          next: (res) => {
            this.products = res.data;
            this.isLoading = false;
          },
          error: () => {
            this.products = this.demoProducts();
            this.isLoading = false;
            this.errorMessage =
              'Showing demo products while API is unavailable.';
          },
        });
    });
  }

  viewProduct(product: Product): void {
    // FIX: Fallback to '_id' if 'id' is undefined (common with MongoDB backends)
    const productId = product.id || (product as any)._id;
    if (productId) {
      this.router.navigate(['/products', productId]);
    } else {
      console.error('Product ID is missing:', product);
    }
  }

  addToCart(product: Product): void {
    if (this.isOutOfStock(product)) {
      this.errorMessage = 'This product is currently out of stock.';
      this.toastService.info(this.errorMessage);
      return;
    }
    this.cartService.addItem(product, 1).subscribe({
      next: () => {
        this.toastService.success('Added to cart.');
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message || 'Unable to add the product to cart.';
        this.toastService.error(this.errorMessage);
      },
    });
  }

  buyNow(product: Product): void {
    // FIX: Handle _id here as well
    const productId = product.id || (product as any)._id;

    if (this.isOutOfStock(product)) {
      this.errorMessage = 'This product is currently out of stock.';
      this.toastService.info(this.errorMessage);
      return;
    }
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: `/checkout?productId=${productId}` },
      });
      return;
    }
    this.router.navigate(['/checkout'], {
      queryParams: { productId: productId },
    });
  }

  private demoProducts(): Product[] {
    return [
      {
        id: 'demo-1',
        name: 'Aurora Noise Cancelling Headphones',
        price: 8999,
        category: 'electronics',
        brand: 'aurora',
        description: 'Immersive sound with 40-hour battery life.',
        imageUrl: ['https://via.placeholder.com/420x320?text=Headphones'],
      },
      {
        id: 'demo-2',
        name: 'Nimbus Smartwatch Pro',
        price: 6499,
        category: 'wearables',
        brand: 'nimbus',
        description: 'Track health metrics with a premium AMOLED display.',
        imageUrl: ['https://via.placeholder.com/420x320?text=Smartwatch'],
      },
      {
        id: 'demo-3',
        name: 'Lumen Desk Lamp',
        price: 1999,
        category: 'home',
        brand: 'lumen',
        description: 'Adjustable brightness with minimalist design.',
        imageUrl: ['https://via.placeholder.com/420x320?text=Desk+Lamp'],
      },
      {
        id: 'demo-4',
        name: 'Vista Travel Backpack',
        price: 3299,
        category: 'fashion',
        brand: 'vista',
        description: 'Water-resistant with dedicated laptop sleeve.',
        imageUrl: ['https://via.placeholder.com/420x320?text=Backpack'],
      },
    ];
  }

  private isOutOfStock(product: Product): boolean {
    if (typeof product.totalStock === 'number') {
      return product.totalStock <= 0;
    }
    return product.stockStatus === 'out-of-stock';
  }
}
