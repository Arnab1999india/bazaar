import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { MerchandisingService } from '../../../core/services/merchandising.service';
import { Category, Product } from '../../../core/models/api.models';
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
  categories: Category[] = [];
  isLoading = true;
  errorMessage = '';
  activeCategory: string | null = null;
  activeCategoryName = 'All Products';
  expandedCategories = new Set<string>();

  constructor(
    private catalogService: CatalogService,
    private cartService: CartService,
    private authService: AuthService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private merchandising: MerchandisingService
  ) {}

  ngOnInit(): void {
    this.merchandising.getCategories().subscribe({
      next: (res) => {
        this.categories = res.data ?? [];
        // Re-resolve name now that categories are loaded
        this.activeCategoryName = this.resolveActiveName(this.activeCategory);
      },
    });

    this.route.queryParams.subscribe((params) => {
      this.isLoading = true;
      this.activeCategory = params['category'] ?? null;
      this.activeCategoryName = this.resolveActiveName(this.activeCategory);

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
            this.errorMessage = 'Showing demo products while API is unavailable.';
          },
        });
    });
  }

  selectCategory(slug: string | null): void {
    const params = slug ? { category: slug } : {};
    this.router.navigate(['/products'], { queryParams: params });
  }

  toggleExpand(catId: string, event: Event): void {
    event.stopPropagation();
    if (this.expandedCategories.has(catId)) {
      this.expandedCategories.delete(catId);
    } else {
      this.expandedCategories.add(catId);
    }
  }

  isExpanded(catId: string): boolean {
    return this.expandedCategories.has(catId);
  }

  private resolveActiveName(slug: string | null): string {
    if (!slug) return 'All Products';
    const found = this.findCategoryBySlug(this.categories, slug);
    return found ? found.name : slug;
  }

  private findCategoryBySlug(cats: Category[], slug: string): Category | undefined {
    for (const cat of cats) {
      if (cat.slug === slug) return cat;
      if (cat.children?.length) {
        const found = this.findCategoryBySlug(cat.children, slug);
        if (found) return found;
      }
    }
    return undefined;
  }

  viewProduct(product: Product): void {
    const productId = product.id || (product as any)._id;
    if (productId) {
      this.router.navigate(['/products', productId]);
    }
  }

  addToCart(product: Product): void {
    if (this.isOutOfStock(product)) {
      this.toastService.info('This product is currently out of stock.');
      return;
    }
    this.cartService.addItem(product, 1).subscribe({
      next: () => this.toastService.success('Added to cart.'),
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Unable to add the product to cart.');
      },
    });
  }

  buyNow(product: Product): void {
    const productId = product.id || (product as any)._id;
    if (this.isOutOfStock(product)) {
      this.toastService.info('This product is currently out of stock.');
      return;
    }
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: `/checkout?productId=${productId}` },
      });
      return;
    }
    this.router.navigate(['/checkout'], { queryParams: { productId } });
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
        category: 'electronics',
        brand: 'nimbus',
        description: 'Track health metrics with a premium AMOLED display.',
        imageUrl: ['https://via.placeholder.com/420x320?text=Smartwatch'],
      },
      {
        id: 'demo-3',
        name: 'Lumen Desk Lamp',
        price: 1999,
        category: 'home-&-kitchen',
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
    if (typeof product.totalStock === 'number') return product.totalStock <= 0;
    return product.stockStatus === 'out-of-stock';
  }
}
