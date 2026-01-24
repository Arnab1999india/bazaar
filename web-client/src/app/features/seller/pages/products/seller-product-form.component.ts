import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormArray,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '../../../../core/services/catalog.service';

@Component({
  selector: 'app-seller-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './seller-product-form.component.html',
  styleUrl: './seller-product-form.component.scss',
})
export class SellerProductFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  isLoading = false;
  productId: string | null = null;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private catalogService: CatalogService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      price: [null, [Validators.required, Validators.min(1)]],
      category: ['', [Validators.required]],
      brand: [''],
      tags: [''], // Will accept comma-separated strings
      imageUrls: ['', [Validators.required]], // Comma-separated URLs
      stockStatus: ['in-stock', [Validators.required]],
      variants: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct(this.productId);
    }
  }

  loadProduct(id: string) {
    this.isLoading = true;
    this.catalogService.getProduct(id).subscribe({
      next: (response) => {
        const product = response.data;
        this.form.patchValue({
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          brand: product.brand ?? '',
          tags: product.tags?.join(', ') ?? '',
          imageUrls: product.imageUrl?.join(', ') ?? '',
          stockStatus: product.stockStatus ?? 'in-stock',
        });
        this.variants.clear();
        (product.variants ?? []).forEach((variant) => {
          this.variants.push(
            this.fb.group({
              sku: [variant.sku, [Validators.required]],
              price: [variant.price, [Validators.required, Validators.min(1)]],
              stock: [variant.stock, [Validators.required, Validators.min(0)]],
              attributes: [
                variant.attributes
                  ? Object.entries(variant.attributes)
                      .map(([key, value]) => `${key}:${value}`)
                      .join(', ')
                  : '',
              ],
            })
          );
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err?.error?.message || 'Unable to load product details.';
      },
    });
  }

  get variants(): FormArray {
    return this.form.get('variants') as FormArray;
  }

  addVariant(): void {
    this.variants.push(
      this.fb.group({
        sku: ['', [Validators.required]],
        price: [null, [Validators.required, Validators.min(1)]],
        stock: [0, [Validators.required, Validators.min(0)]],
        attributes: [''],
      })
    );
  }

  removeVariant(index: number): void {
    this.variants.removeAt(index);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Please fill all required fields.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const formData = this.form.value;

    const productPayload = {
      name: String(formData.name ?? '').trim(),
      description: String(formData.description ?? '').trim(),
      price: Number(formData.price),
      category: String(formData.category ?? '').trim(),
      brand: String(formData.brand ?? '').trim() || undefined,
      stockStatus: formData.stockStatus,
      tags: String(formData.tags ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      imageUrl: String(formData.imageUrls ?? '')
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean),
      variants: (formData.variants ?? [])
        .filter((variant: any) => variant?.sku)
        .map((variant: any) => ({
          sku: String(variant.sku ?? '').trim(),
          price: Number(variant.price),
          stock: Number(variant.stock ?? 0),
          attributes: String(variant.attributes ?? '')
            .split(',')
            .map((pair: string) => pair.trim())
            .filter(Boolean)
            .reduce<Record<string, string>>((acc, pair) => {
              const [key, value] = pair.split(':').map((part) => part.trim());
              if (key && value) {
                acc[key] = value;
              }
              return acc;
            }, {}),
        })),
    };
    const request$ =
      this.isEditMode && this.productId
        ? this.catalogService.updateProduct(this.productId, productPayload)
        : this.catalogService.createProduct(productPayload);

    request$.subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/seller/products']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err?.error?.message ||
          'Unable to save the product right now.';
      },
    });
  }
}
