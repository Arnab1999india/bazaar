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
  selector: 'app-seller-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './seller-login.component.html',
  styleUrl: './seller-login.component.scss',
})
export class SellerLoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const { email, password } = this.loginForm.value;
    const payload = {
      email: String(email ?? '').trim().toLowerCase(),
      password: String(password ?? ''),
    };

    this.authService.login(payload, true).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.data.user.role !== 'seller') {
          this.authService.signOut();
          this.errorMessage = 'This account is not a seller.';
          return;
        }
        this.router.navigate(['/seller']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err?.error?.message || 'Unable to sign in. Please try again.';
      },
    });
  }
}
