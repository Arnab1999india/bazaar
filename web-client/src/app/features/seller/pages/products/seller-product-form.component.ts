import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FormBuilder,
  FormArray,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogService } from '../../../../core/services/catalog.service';

interface ImageEntry {
  preview: string;
  url: string;
  uploading: boolean;
  error?: string;
}

@Component({
  selector: 'app-seller-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './seller-product-form.component.html',
  styleUrl: './seller-product-form.component.scss',
})
export class SellerProductFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  isLoading = false;
  productId: string | null = null;
  errorMessage = '';

  imageList: ImageEntry[] = [];
  currentSlide = 0;
  urlInput = '';

  readonly MAX_IMAGES = 5;
  readonly MIN_IMAGES = 1;

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
      tags: [''],
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

  loadProduct(id: string): void {
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
          stockStatus: product.stockStatus ?? 'in-stock',
        });

        this.imageList = (product.imageUrl ?? []).map((url) => ({
          preview: url,
          url,
          uploading: false,
        }));
        if (this.imageList.length > 0) this.currentSlide = 0;

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

  // ---- Image management ----

  addImageFromUrl(): void {
    const url = this.urlInput.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      this.errorMessage = 'Image URL must start with http:// or https://';
      return;
    }
    if (this.imageList.length >= this.MAX_IMAGES) return;
    this.imageList.push({ preview: url, url, uploading: false });
    this.currentSlide = this.imageList.length - 1;
    this.urlInput = '';
    this.errorMessage = '';
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const remaining = this.MAX_IMAGES - this.imageList.length;
    const files = Array.from(input.files).slice(0, remaining);
    input.value = '';

    files.forEach((file) => {
      const entry: ImageEntry = { preview: '', url: '', uploading: true };
      this.imageList.push(entry);
      this.currentSlide = this.imageList.length - 1;

      const reader = new FileReader();
      reader.onload = (e) => {
        entry.preview = e.target?.result as string;
      };
      reader.readAsDataURL(file);

      this.catalogService.uploadProductImages([file]).subscribe({
        next: (response) => {
          entry.url = response.data[0];
          entry.uploading = false;
          entry.error = undefined;
        },
        error: () => {
          entry.error = 'Upload failed. Remove and try again.';
          entry.uploading = false;
        },
      });
    });
  }

  removeImage(index: number): void {
    this.imageList.splice(index, 1);
    if (this.currentSlide >= this.imageList.length) {
      this.currentSlide = Math.max(0, this.imageList.length - 1);
    }
  }

  prevSlide(): void {
    if (this.currentSlide > 0) this.currentSlide--;
  }

  nextSlide(): void {
    if (this.currentSlide < this.imageList.length - 1) this.currentSlide++;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  get hasUploadingImages(): boolean {
    return this.imageList.some((img) => img.uploading);
  }

  get slideTranslate(): string {
    return `translateX(${-this.currentSlide * 100}%)`;
  }

  // ---- Submit ----

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Please fill all required fields.';
      return;
    }
    if (this.imageList.length < this.MIN_IMAGES) {
      this.errorMessage = 'At least 1 image is required.';
      return;
    }
    if (this.hasUploadingImages) {
      this.errorMessage = 'Please wait for all images to finish uploading.';
      return;
    }
    if (this.imageList.some((img) => !img.url)) {
      this.errorMessage =
        'Some images failed to upload. Remove them and try again.';
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
        .map((tag: string) => tag.trim())
        .filter(Boolean),
      imageUrl: this.imageList.map((img) => img.url),
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
              if (key && value) acc[key] = value;
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
          err?.error?.message || 'Unable to save the product right now.';
      },
    });
  }
}
