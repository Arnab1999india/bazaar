import { Component } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { map, Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, AsyncPipe, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  isLoggedIn$: Observable<boolean>;
  cartCount$: Observable<number>;
  user$!: Observable<import('../../core/models/api.models').AuthUser | null>;
  searchTerm = '';

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {
    this.isLoggedIn$ = this.authService.authState$;
    this.cartCount$ = this.cartService.cartItems$.pipe(
      map((items) => items.reduce((total, item) => total + item.quantity, 0))
    );
    this.user$ = this.authService.user$;
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
