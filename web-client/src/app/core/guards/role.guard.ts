import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (roles: Array<'buyer' | 'seller' | 'admin'>): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    const user = authService.getCurrentUser();
    if (user && roles.includes(user.role ?? 'buyer')) {
      return true;
    }

    return router.createUrlTree(['/profile']);
  };
};
