import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  constructor(private authService: AuthService, private router: Router) {}

  categories = [
    {
      title: 'Computers & Accessories',
      image:
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    },
    {
      title: 'Fashion',
      image:
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    },
    {
      title: 'Home & Kitchen',
      image:
        'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    },
    {
      title: 'Beauty & Personal Care',
      image:
        'https://images.unsplash.com/photo-1596462502278-27bfdd403348?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    },
  ];
  // Logic for fetching featured products will go here

  handleShopNow() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/products' },
      });
      return;
    }
    this.router.navigate(['/products']);
  }
}
