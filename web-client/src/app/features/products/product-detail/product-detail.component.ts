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
  selectedImage: string | null = null;

  // Demo Data for UI richness
  demoDiscount = 42;
  deliveryDate = '';
  demoFeatures = [
    'High-performance material ensures durability and longevity.',
    'Designed for optimal ease of use and installation.',
    'Includes a 1-year manufacturer warranty for peace of mind.',
    'Compatible with a wide range of devices and accessories.',
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogService: CatalogService,
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Calculate a fake delivery date (Tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.deliveryDate = tomorrow.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    const productId = this.route.snapshot.paramMap.get('id');
    if (!productId) {
      this.router.navigate(['/products']);
      return;
    }

    this.catalogService.getProduct(productId).subscribe({
      next: (res) => {
        this.product = res.data;
        // Ensure image array exists for gallery logic
        if (!this.product.imageUrl || this.product.imageUrl.length === 0) {
          this.product.imageUrl = [
            'https://via.placeholder.com/600x600?text=No+Image',
          ];
        }
        // Duplicate image if only one exists to show thumbnail strip effect
        if (this.product.imageUrl.length === 1) {
          this.product.imageUrl.push(this.product.imageUrl[0]);
          this.product.imageUrl.push(this.product.imageUrl[0]);
        }
        this.selectedImage = this.product.imageUrl[0];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        // Fallback for demo if API fails
        this.product = {
          id: 'demo',
          name: 'Kratos Mobile Holder for Bike with One-Touch Lock',
          price: 499,
          category: 'Electronics',
          brand: 'Kratos',
          description:
            'Shockproof Mobile Stand for Motorcycles, Universal Anti-Slip.',
          imageUrl: [
            'https://via.placeholder.com/500?text=Main+Image',
            'https://via.placeholder.com/500?text=Side+View',
          ],
        };
        this.selectedImage = this.product.imageUrl![0];
      },
    });
  }

  // Calculate Fake MRP based on discount
  getOriginalPrice(currentPrice: number): number {
    return currentPrice * (100 / (100 - this.demoDiscount));
  }

  addToCart(): void {
    if (!this.product) return;
    this.cartService.addItem(this.product, 1);
    // You might want to show a toast/notification here
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
}
