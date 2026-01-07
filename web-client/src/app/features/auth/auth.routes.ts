import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'admin-login',
    loadComponent: () =>
      import('./admin-login/admin-login.component').then(
        (m) => m.AdminLoginComponent
      ),
  },
  {
    path: 'seller-login',
    loadComponent: () =>
      import('./seller-login/seller-login.component').then(
        (m) => m.SellerLoginComponent
      ),
  },
  {
    path: 'seller-register',
    loadComponent: () =>
      import('../seller-onboarding/seller-register/seller-register.component').then(
        (m) => m.SellerRegisterComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: 'otp-validation',
    loadComponent: () =>
      import('./otp-validation/otp-validation.component').then(
        (m) => m.OtpValidationComponent
      ),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
