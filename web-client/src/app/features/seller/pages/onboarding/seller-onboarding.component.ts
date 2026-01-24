import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SellerService } from '../../../../core/services/seller.service';
import { SellerProfile, SellerProfileInput } from '../../../../core/models/api.models';

@Component({
  selector: 'app-seller-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './seller-onboarding.component.html',
  styleUrl: './seller-onboarding.component.scss',
})
export class SellerOnboardingComponent implements OnInit {
  form: FormGroup;
  profile: SellerProfile | null = null;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  returnUrl = '/seller';

  constructor(
    private fb: FormBuilder,
    private sellerService: SellerService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      businessName: ['', [Validators.required, Validators.minLength(2)]],
      legalName: [''],
      businessType: ['individual', [Validators.required]],
      phone: ['', [Validators.required, Validators.minLength(8)]],
      gstNumber: [''],
      panNumber: [''],
      shopAddress: this.fb.group({
        line1: ['', [Validators.required]],
        line2: [''],
        city: ['', [Validators.required]],
        state: ['', [Validators.required]],
        country: ['', [Validators.required]],
        postalCode: ['', [Validators.required]],
      }),
      warehouseAddress: this.fb.group({
        line1: [''],
        line2: [''],
        city: [''],
        state: [''],
        country: [''],
        postalCode: [''],
      }),
    });
  }

  ngOnInit(): void {
    this.returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') || '/seller';
    this.loadProfile();
  }

  get statusLabel(): string {
    if (!this.profile) return 'Not submitted';
    switch (this.profile.status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending review';
    }
  }

  get canEdit(): boolean {
    return !this.profile || this.profile.status !== 'approved';
  }

  private loadProfile(): void {
    this.isLoading = true;
    this.sellerService.getMyProfile().subscribe({
      next: (res) => {
        this.profile = res.data;
        this.patchForm(res.data);
        this.isLoading = false;
      },
      error: (err) => {
        if (err?.status !== 404) {
          this.errorMessage = 'Unable to load your seller profile.';
        }
        this.isLoading = false;
      },
    });
  }

  private patchForm(profile: SellerProfile): void {
    this.form.patchValue({
      businessName: profile.businessName,
      legalName: profile.legalName ?? '',
      businessType: profile.businessType,
      phone: profile.phone,
      gstNumber: profile.gstNumber ?? '',
      panNumber: profile.panNumber ?? '',
      shopAddress: {
        line1: profile.shopAddress?.line1 ?? '',
        line2: profile.shopAddress?.line2 ?? '',
        city: profile.shopAddress?.city ?? '',
        state: profile.shopAddress?.state ?? '',
        country: profile.shopAddress?.country ?? '',
        postalCode: profile.shopAddress?.postalCode ?? '',
      },
      warehouseAddress: {
        line1: profile.warehouseAddress?.line1 ?? '',
        line2: profile.warehouseAddress?.line2 ?? '',
        city: profile.warehouseAddress?.city ?? '',
        state: profile.warehouseAddress?.state ?? '',
        country: profile.warehouseAddress?.country ?? '',
        postalCode: profile.warehouseAddress?.postalCode ?? '',
      },
    });
  }

  submit(): void {
    if (this.form.invalid || !this.canEdit) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.buildPayload();
    const request = this.profile
      ? this.sellerService.updateProfile(payload)
      : this.sellerService.onboard(payload as SellerProfileInput);

    request.subscribe({
      next: (res) => {
        this.profile = res.data;
        this.successMessage = 'Profile submitted for review.';
        this.isSubmitting = false;
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          'Unable to submit your seller profile right now.';
        this.isSubmitting = false;
      },
    });
  }

  private buildPayload(): Partial<SellerProfileInput> {
    const raw = this.form.value;
    const warehouse = raw.warehouseAddress;
    const hasWarehouse =
      warehouse &&
      Object.values(warehouse).some((value: string) => String(value).trim());

    return {
      businessName: raw.businessName,
      legalName: raw.legalName || undefined,
      businessType: raw.businessType,
      phone: raw.phone,
      gstNumber: raw.gstNumber || undefined,
      panNumber: raw.panNumber || undefined,
      shopAddress: raw.shopAddress,
      warehouseAddress: hasWarehouse ? raw.warehouseAddress : undefined,
    };
  }

  backToDashboard(): void {
    this.router.navigateByUrl(this.returnUrl);
  }
}
