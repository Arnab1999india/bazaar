import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { sellerApprovalGuard } from '../../core/guards/seller-approval.guard';
import { SellerLayoutComponent } from './layout/seller-layout.component';
import { SellerDashboardComponent } from './pages/dashboard/seller-dashboard.component';
import { SellerProductsComponent } from './pages/products/seller-products.component';
import { SellerProductFormComponent } from './pages/products/seller-product-form.component';
import { SellerOnboardingComponent } from './pages/onboarding/seller-onboarding.component';

export const SELLER_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['seller'])],
    component: SellerLayoutComponent,
    children: [
      {
        path: '',
        component: SellerDashboardComponent,
      },
      {
        path: 'onboarding',
        component: SellerOnboardingComponent,
      },
      {
        path: 'products',
        canActivate: [sellerApprovalGuard],
        component: SellerProductsComponent,
      },
      {
        path: 'products/new',
        canActivate: [sellerApprovalGuard],
        component: SellerProductFormComponent,
      },
      {
        path: 'products/:id/edit',
        canActivate: [sellerApprovalGuard],
        component: SellerProductFormComponent,
      },
    ],
  },
];
