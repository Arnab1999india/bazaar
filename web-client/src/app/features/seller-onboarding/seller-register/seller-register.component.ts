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
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-seller-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './seller-register.component.html',
  styleUrl: './seller-register.component.scss',
})
export class SellerRegisterComponent {
  form: FormGroup;
  isSubmitting = false;
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  successMessage = '';
  private readonly passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).+$/;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
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

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
      return;
    }
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private buildRegistrationPayload() {
    return {
      name: String(this.form.value.fullName ?? '').trim(),
      email: String(this.form.value.email ?? '').trim().toLowerCase(),
      phone: String(this.form.value.mobile ?? '').trim(),
      password: String(this.form.value.password ?? ''),
      role: 'seller' as const,
    };
  }

  createAccount(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.buildRegistrationPayload();
    this.authService.initiateRegistration(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage =
          'Account created. Please verify the OTP sent to your email.';
        this.router.navigate(['/auth/otp-validation'], {
          queryParams: { email: payload.email, purpose: 'registration' },
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage =
          err?.error?.message ||
          'Unable to create your account right now. Please try again.';
      },
    });
  }
}
