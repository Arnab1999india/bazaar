import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { StoreService } from '../../../../core/services/store.service';
import { CatalogService } from '../../../../core/services/catalog.service';
import { Product } from '../../../../core/models/api.models';

interface MultiSelectState {
  open: boolean;
  search: string;
  selected: string[];
}

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './seller-products.component.html',
  styleUrl: './seller-products.component.scss',
})
export class SellerProductsComponent implements OnInit {
  products: Product[] = [];
  isLoading = true;
  errorMessage = '';

  categoryFilter: MultiSelectState = { open: false, search: '', selected: [] };
  stockFilter: MultiSelectState = { open: false, search: '', selected: [] };

  readonly stockOptions = [
    { label: 'In Stock', value: 'in-stock' },
    { label: 'Out of Stock', value: 'out-of-stock' },
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private storeService: StoreService,
    private catalogService: CatalogService,
    private elRef: ElementRef
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
            err?.error?.message || 'Unable to load your products right now.';
        },
      });
  }

  // ---- ID helper (lean() returns _id, not id) ----
  getProductId(product: Product): string {
    return product.id || (product as any)._id?.toString() || '';
  }

  // ---- Filter computed values ----

  get categoryOptions(): { label: string; value: string }[] {
    const search = this.categoryFilter.search.toLowerCase();
    const unique = [...new Set(this.products.map((p) => p.category).filter(Boolean))];
    return unique
      .filter((c) => !search || c.toLowerCase().includes(search))
      .map((c) => ({ label: c, value: c }));
  }

  get filteredStockOptions(): { label: string; value: string }[] {
    const search = this.stockFilter.search.toLowerCase();
    return this.stockOptions.filter(
      (o) => !search || o.label.toLowerCase().includes(search)
    );
  }

  get filteredProducts(): Product[] {
    return this.products.filter((p) => {
      const catOk =
        !this.categoryFilter.selected.length ||
        this.categoryFilter.selected.includes(p.category);
      const stockOk =
        !this.stockFilter.selected.length ||
        this.stockFilter.selected.includes(p.stockStatus ?? '');
      return catOk && stockOk;
    });
  }

  get activeFilterCount(): number {
    return this.categoryFilter.selected.length + this.stockFilter.selected.length;
  }

  // ---- Filter actions ----

  toggleCategoryOption(value: string): void {
    this.toggleOption(this.categoryFilter, value);
  }

  toggleStockOption(value: string): void {
    this.toggleOption(this.stockFilter, value);
  }

  private toggleOption(state: MultiSelectState, value: string): void {
    const idx = state.selected.indexOf(value);
    if (idx >= 0) {
      state.selected.splice(idx, 1);
    } else {
      state.selected.push(value);
    }
  }

  removeCategoryFilter(value: string): void {
    this.categoryFilter.selected = this.categoryFilter.selected.filter(
      (v) => v !== value
    );
  }

  removeStockFilter(value: string): void {
    this.stockFilter.selected = this.stockFilter.selected.filter(
      (v) => v !== value
    );
  }

  clearAllFilters(): void {
    this.categoryFilter.selected = [];
    this.stockFilter.selected = [];
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.categoryFilter.open = false;
      this.stockFilter.open = false;
    }
  }

  // ---- Product actions ----

  stockLabel(product: Product): string {
    if (typeof product.totalStock === 'number') {
      return String(product.totalStock);
    }
    if (product.stockStatus) {
      return product.stockStatus === 'in-stock' ? 'In stock' : 'Out of stock';
    }
    return 'N/A';
  }

  editProduct(product: Product): void {
    const id = this.getProductId(product);
    if (!id) return;
    this.router.navigate(['/seller/products', id, 'edit']);
  }

  deleteProduct(product: Product): void {
    const id = this.getProductId(product);
    if (!id || !confirm('Delete this product?')) return;
    this.catalogService.deleteProduct(id).subscribe({
      next: () => {
        this.products = this.products.filter(
          (p) => this.getProductId(p) !== id
        );
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message || 'Unable to delete the product right now.';
      },
    });
  }
}
