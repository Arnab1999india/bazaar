import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    component: ProductListComponent,
  },
  {
    path: ':id',
    canActivate: [authGuard],
    component: ProductDetailComponent,
  },
];
