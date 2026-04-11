import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { ApiResponse } from '../models/api.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private wishlistIds$ = new BehaviorSubject<string[]>([]);

  constructor(private http: HttpClient, private authService: AuthService) {}

  /** Load wishlist from backend. Call after login. */
  loadWishlist(): void {
    if (!this.authService.isAuthenticated()) return;
    this.http
      .get<ApiResponse<string[]>>(`${API_BASE_URL}${API_ENDPOINTS.wishlist.get}`, {
        headers: this.authService.authHeaders,
      })
      .subscribe({
        next: (res) => this.wishlistIds$.next(res.data ?? []),
        error: () => {},
      });
  }

  getWishlistIds(): Observable<string[]> {
    return this.wishlistIds$.asObservable();
  }

  isWishlisted(productId: string): boolean {
    return this.wishlistIds$.value.includes(productId);
  }

  toggleWishlist(productId: string): void {
    if (!this.authService.isAuthenticated()) return;

    const currentIds = this.wishlistIds$.value;
    const isIn = currentIds.includes(productId);

    // Optimistic update
    if (isIn) {
      this.wishlistIds$.next(currentIds.filter((id) => id !== productId));
      this.http
        .delete<ApiResponse<string[]>>(
          `${API_BASE_URL}${API_ENDPOINTS.wishlist.remove(productId)}`,
          { headers: this.authService.authHeaders }
        )
        .subscribe({ error: () => this.wishlistIds$.next(currentIds) });
    } else {
      this.wishlistIds$.next([...currentIds, productId]);
      this.http
        .post<ApiResponse<string[]>>(
          `${API_BASE_URL}${API_ENDPOINTS.wishlist.add(productId)}`,
          {},
          { headers: this.authService.authHeaders }
        )
        .subscribe({ error: () => this.wishlistIds$.next(currentIds) });
    }
  }
}
