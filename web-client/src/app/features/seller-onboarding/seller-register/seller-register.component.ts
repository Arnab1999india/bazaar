import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router } from '@angular/router';

type BusinessType =
  | 'individual'
  | 'partnership'
  | 'pvt_ltd_llp'
  | 'registered_company';

@Component({
  selector: 'app-seller-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './seller-register.component.html',
  styleUrl: './seller-register.component.scss',
})
export class SellerRegisterComponent {
  form: FormGroup;
  otpSent = false;
  otpVerified = false;
  isSubmitting = false;
  isSendingOtp = false;
  errorMessage = '';
  successMessage = '';
  private readonly passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).+$/;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        fullName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        mobile: [
          '',
          [Validators.required, Validators.pattern(/^\+?[\d\s-]{8,}$/)],
        ],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6),
            Validators.maxLength(128),
            Validators.pattern(this.passwordPattern),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
        businessType: ['individual', [Validators.required]],
        otp: [''],
        acceptTerms: [false, [Validators.requiredTrue]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ mustMatch: true });
    } else {
      const errors = confirmPassword?.errors;
      if (errors) {
        delete errors['mustMatch'];
        confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
    return null;
  }

  sendOtp(): void {
    if (this.form.get('email')?.invalid) {
      this.form.get('email')?.markAsTouched();
      return;
    }
    this.isSendingOtp = true;
    this.errorMessage = '';
    this.successMessage = '';

    const email = String(this.form.value.email ?? '').trim().toLowerCase();
    setTimeout(() => {
      this.otpSent = true;
      this.isSendingOtp = false;
      this.successMessage = `OTP sent to ${email}`;
    }, 600);
  }

  verifyOtp(): void {
    const otp = String(this.form.value.otp ?? '').trim();
    if (!otp || otp.length < 4) {
      this.errorMessage = 'Enter the OTP to verify your email.';
      return;
    }
    this.otpVerified = true;
    this.errorMessage = '';
    this.successMessage = 'Email verified successfully.';
  }

  createAccount(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.otpVerified) {
      this.errorMessage = 'Please verify your email OTP first.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      fullName: String(this.form.value.fullName ?? '').trim(),
      email: String(this.form.value.email ?? '').trim().toLowerCase(),
      mobile: String(this.form.value.mobile ?? '').trim(),
      password: String(this.form.value.password ?? ''),
      businessType: this.form.value.businessType as BusinessType,
      sellerStatus: 'pending_profile',
    };

    setTimeout(() => {
      this.isSubmitting = false;
      this.successMessage = 'Seller account created. Continue onboarding.';
      this.router.navigate(['/seller']);
    }, 600);
  }
}
