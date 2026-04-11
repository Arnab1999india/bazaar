import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

type AppRole = 'customer' | 'seller' | 'admin';

export const roleGuard = (roles: Array<AppRole>): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    const user = authService.getCurrentUser();
    const normalizedRole =
      user?.role === 'buyer' ? 'customer' : (user?.role ?? 'customer');
    if (user && roles.includes(normalizedRole)) {
      return true;
    }

    return router.createUrlTree(['/profile']);
  };
};
