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
      image: 'assets/laptop-placeholder.jpg',
      link: 'Shop now',
    },
    {
      title: 'Fashion',
      image: 'assets/fashion-placeholder.jpg',
      link: 'Shop now',
    },
    {
      title: 'Home & Kitchen',
      image: 'assets/home-placeholder.jpg',
      link: 'Shop now',
    },
    {
      title: 'Beauty & Personal Care',
      image: 'assets/beauty-placeholder.jpg',
      link: 'Shop now',
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
