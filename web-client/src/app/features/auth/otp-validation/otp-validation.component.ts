import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-otp-validation',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './otp-validation.component.html',
  styleUrl: './otp-validation.component.scss',
})
export class OtpValidationComponent {
  otpForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  private email = '';
  private purpose: 'password-reset' | 'registration' = 'password-reset';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });

    this.route.queryParams.subscribe((params) => {
      this.email = String(params['email'] ?? '')
        .trim()
        .toLowerCase();
      const purpose = String(params['purpose'] ?? '').trim();
      this.purpose =
        purpose === 'registration' ? 'registration' : 'password-reset';
    });
  }

  onOtpInput(event: any) {
    const value = event.target.value.replace(/\D/g, '');
    this.otpForm.get('otp')?.setValue(value);
  }

  onSubmit() {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }
    if (!this.email) {
      this.errorMessage = 'Missing email address for OTP verification.';
      return;
    }

    const otp = String(this.otpForm.value.otp ?? '');
    this.isSubmitting = true;
    this.errorMessage = '';

    const onSuccess = () => {
      this.isSubmitting = false;
      if (this.purpose === 'registration') {
        this.router.navigate(['/auth/login']);
        return;
      }
      this.router.navigate(['/auth/reset-password'], {
        queryParams: { email: this.email },
      });
    };

    const onError = (err: any) => {
      this.isSubmitting = false;
      this.errorMessage =
        err?.error?.message || 'Invalid OTP. Please try again.';
    };

    if (this.purpose === 'registration') {
      this.authService
        .verifyRegistrationOtp({
          email: this.email,
          otp,
          purpose: 'registration',
        })
        .subscribe({ next: onSuccess, error: onError });
      return;
    }

    this.authService
      .verifyPasswordResetOtp({
        email: this.email,
        otp,
        purpose: 'password-reset',
      })
      .subscribe({ next: onSuccess, error: onError });
  }

  resendOtp() {
    if (!this.email) {
      this.errorMessage = 'Missing email address to resend OTP.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService
      .resendOtp({ email: this.email, purpose: this.purpose })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage =
            err?.error?.message || 'Unable to resend OTP. Please try again.';
        },
      });
  }

  navigateToForgotPassword() {
    this.router.navigate(['/auth/forgot-password']);
  }
}
