import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { SellerService } from '../services/seller.service';

export const sellerApprovalGuard: CanActivateFn = (route, state) => {
  const sellerService = inject(SellerService);
  const router = inject(Router);

  return sellerService.getMyProfile().pipe(
    map((res) => {
      if (res.data?.status === 'approved') {
        return true;
      }
      return router.createUrlTree(['/seller/onboarding'], {
        queryParams: { returnUrl: state.url },
      });
    }),
    catchError(() =>
      of(
        router.createUrlTree(['/seller/onboarding'], {
          queryParams: { returnUrl: state.url },
        })
      )
    )
  );
};
