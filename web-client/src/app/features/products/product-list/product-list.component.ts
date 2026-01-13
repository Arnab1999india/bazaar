import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { CartService } from '../../../core/services/cart.service';
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.catalogService.listProducts().subscribe({
      next: (res) => {
        this.products = res.data;
        this.isLoading = false;
      },
      error: () => {
        this.products = this.demoProducts();
        this.isLoading = false;
        this.errorMessage = 'Showing demo products while API is unavailable.';
      },
    });
  }

  viewProduct(product: Product): void {
    this.router.navigate(['/products', product.id]);
  }

  addToCart(product: Product): void {
    this.cartService.addItem(product, 1);
  }

  buyNow(product: Product): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: `/checkout?productId=${product.id}` },
      });
      return;
    }
    this.router.navigate(['/checkout'], {
      queryParams: { productId: product.id },
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
}
