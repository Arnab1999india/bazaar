import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/api.models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  isLoading = true;
  errorMessage = '';
  deliveryEstimate = 'Delivery in 2-4 business days';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogService: CatalogService,
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (!productId) {
      this.router.navigate(['/products']);
      return;
    }

    this.catalogService.getProduct(productId).subscribe({
      next: (res) => {
        this.product = res.data;
        this.isLoading = false;
      },
      error: () => {
        this.product = this.demoProduct(productId);
        this.isLoading = false;
        this.errorMessage = 'Showing demo data while API is unavailable.';
      },
    });
  }

  addToCart(): void {
    if (!this.product) return;
    this.cartService.addItem(this.product, 1);
  }

  buyNow(): void {
    if (!this.product) return;
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: `/checkout?productId=${this.product.id}` },
      });
      return;
    }
    this.router.navigate(['/checkout'], {
      queryParams: { productId: this.product.id },
    });
  }

  private demoProduct(productId: string): Product {
    return {
      id: productId,
      name: 'Demo Product',
      price: 4999,
      category: 'electronics',
      brand: 'bazaar',
      description:
        'This is a demo product description for the selected item.',
      imageUrl: ['https://via.placeholder.com/720x520?text=Product+Detail'],
    };
  }
}
