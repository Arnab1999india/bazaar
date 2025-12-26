import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    const email = String(this.forgotPasswordForm.value.email ?? '')
      .trim()
      .toLowerCase();
    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.requestPasswordReset(email).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/auth/otp-validation'], {
          queryParams: { email, purpose: 'password-reset' },
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage =
          err?.error?.message ||
          'Unable to send reset code. Please try again.';
      },
    });
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
