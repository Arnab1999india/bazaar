import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CatalogService } from '../../../core/services/catalog.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReviewService } from '../../../core/services/review.service';
import { Product, Review } from '../../../core/models/api.models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
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

  // Reviews
  reviews: Review[] = [];
  isLoadingReviews = false;
  showReviewForm = false;
  reviewForm: FormGroup;
  isSubmittingReview = false;
  reviewError = '';
  reviewSuccess = '';
  hoverRating = 0;      // tracks hover for star rendering
  editingReviewId: string | null = null;   // null = create, string = edit

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogService: CatalogService,
    private cartService: CartService,
    private authService: AuthService,
    private reviewService: ReviewService,
    private toastService: ToastService,
    private fb: FormBuilder,
  ) {
    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(5)]],
    });
  }

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

    this.loadReviews(productId);

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
    if (this.isOutOfStock(this.product)) {
      this.toastService.info('This product is currently out of stock.');
      return;
    }
    this.cartService.addItem(this.product, 1).subscribe({
      next: () => {
        this.toastService.success('Added to cart.');
      },
      error: (err) => {
        const message =
          err?.error?.message || 'Unable to add the product to cart.';
        this.toastService.error(message);
      },
    });
    // You might want to show a toast/notification here
  }

  buyNow(): void {
    if (!this.product) return;
    if (this.isOutOfStock(this.product)) {
      this.toastService.info('This product is currently out of stock.');
      return;
    }
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

  public isOutOfStock(product: Product): boolean {
    if (typeof product.totalStock === 'number') {
      return product.totalStock <= 0;
    }
    return product.stockStatus === 'out-of-stock';
  }

  // ── Reviews ───────────────────────────────────────────
  loadReviews(productId: string): void {
    this.isLoadingReviews = true;
    this.reviewService.getReviewsByProduct(productId).subscribe({
      next: (res) => {
        this.reviews = res.data ?? [];
        this.isLoadingReviews = false;
      },
      error: () => { this.isLoadingReviews = false; },
    });
  }

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  get currentUserId(): string | undefined {
    return this.authService.getCurrentUser()?.id;
  }

  getReviewUserId(review: Review): string {
    if (typeof review.user === 'object') return review.user.id;
    return review.user;
  }

  getReviewUserName(review: Review): string {
    if (typeof review.user === 'object') return review.user.name;
    return 'User';
  }

  isOwnReview(review: Review): boolean {
    return !!this.currentUserId && this.getReviewUserId(review) === this.currentUserId;
  }

  openReviewForm(): void {
    this.showReviewForm = true;
    this.editingReviewId = null;
    this.reviewError = '';
    this.reviewSuccess = '';
    this.reviewForm.reset({ rating: 0, comment: '' });
  }

  openEditForm(review: Review): void {
    this.showReviewForm = true;
    this.editingReviewId = review.id;
    this.reviewError = '';
    this.reviewSuccess = '';
    this.reviewForm.setValue({ rating: review.rating, comment: review.comment });
  }

  closeReviewForm(): void {
    this.showReviewForm = false;
    this.editingReviewId = null;
    this.reviewError = '';
  }

  setRating(value: number): void {
    this.reviewForm.patchValue({ rating: value });
  }

  starClass(starIndex: number): string {
    const current = this.hoverRating || this.reviewForm.value.rating || 0;
    return starIndex <= current ? 'star filled' : 'star';
  }

  submitReview(): void {
    if (this.reviewForm.invalid || !this.product) return;
    this.isSubmittingReview = true;
    this.reviewError = '';

    const { rating, comment } = this.reviewForm.value;

    if (this.editingReviewId) {
      this.reviewService.updateReview(this.editingReviewId, { rating, comment }).subscribe({
        next: (res) => {
          const idx = this.reviews.findIndex(r => r.id === this.editingReviewId);
          if (idx > -1) this.reviews[idx] = res.data;
          this.reviewSuccess = 'Review updated.';
          this.isSubmittingReview = false;
          this.closeReviewForm();
        },
        error: (err) => {
          this.reviewError = err?.error?.message || 'Failed to update review.';
          this.isSubmittingReview = false;
        },
      });
    } else {
      const productId = this.product.id || (this.product as any)._id;
      this.reviewService.createReview({ productId, rating, comment }).subscribe({
        next: (res) => {
          this.reviews.unshift(res.data);
          this.reviewSuccess = 'Review submitted!';
          this.isSubmittingReview = false;
          this.closeReviewForm();
        },
        error: (err) => {
          this.reviewError = err?.error?.message || 'Failed to submit review.';
          this.isSubmittingReview = false;
        },
      });
    }
  }

  deleteReview(review: Review): void {
    if (!confirm('Delete this review?')) return;
    this.reviewService.deleteReview(review.id).subscribe({
      next: () => {
        this.reviews = this.reviews.filter(r => r.id !== review.id);
      },
      error: () => { this.toastService.error('Failed to delete review.'); },
    });
  }

  avgRating(): number {
    if (!this.reviews.length) return 0;
    return this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length;
  }

  starsArray(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }
}
