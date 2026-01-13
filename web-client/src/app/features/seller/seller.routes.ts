import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { SellerLayoutComponent } from './layout/seller-layout.component';
import { SellerDashboardComponent } from './pages/dashboard/seller-dashboard.component';
import { SellerProductsComponent } from './pages/products/seller-products.component';
import { SellerProductFormComponent } from './pages/products/seller-product-form.component';

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
        path: 'products',
        component: SellerProductsComponent,
      },
      {
        path: 'products/new',
        component: SellerProductFormComponent,
      },
      {
        path: 'products/:id/edit',
        component: SellerProductFormComponent,
      },
    ],
  },
];
