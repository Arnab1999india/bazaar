import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    // Lazy load the Home Routes
    loadChildren: () =>
      import('./features/home/home.routes').then((m) => m.HOME_ROUTES),
  },
  {
    path: 'auth',
    // Lazy load the Auth Routes
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '**', // Wildcard route for 404
    redirectTo: '',
  },
];
