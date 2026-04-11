import { Component, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { MerchandisingService } from '../../core/services/merchandising.service';
import { Category } from '../../core/models/api.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, AsyncPipe, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  isLoggedIn$: Observable<boolean>;
  cartCount$: Observable<number>;
  user$!: Observable<import('../../core/models/api.models').AuthUser | null>;
  searchTerm = '';
  navCategories: Category[] = [];

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private merchandising: MerchandisingService
  ) {
    this.isLoggedIn$ = this.authService.authState$;
    this.cartCount$ = this.cartService.cartItems$.pipe(
      map((items) => items.reduce((total, item) => total + item.quantity, 0))
    );
    this.user$ = this.authService.user$;
  }

  ngOnInit(): void {
    this.merchandising.getCategories().subscribe({
      next: (res) => {
        this.navCategories = res.data ?? [];
      },
      error: () => {
        // silently degrade — static fallback kept by default empty array
      },
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.authService.signOut();
        this.router.navigate(['/auth/login']);
      },
    });
  }

  submitSearch(): void {
    const query = this.searchTerm.trim();
    this.router.navigate(['/products'], {
      queryParams: query ? { q: query } : {},
    });
  }
}
