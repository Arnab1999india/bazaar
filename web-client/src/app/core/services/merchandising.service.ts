import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { ApiResponse, Category, Product } from '../models/api.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class MerchandisingService {
  private categoriesCache$?: Observable<ApiResponse<Category[]>>;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getCategories(): Observable<ApiResponse<Category[]>> {
    if (!this.categoriesCache$) {
      this.categoriesCache$ = this.http.get<ApiResponse<Category[]>>(
        `${API_BASE_URL}${API_ENDPOINTS.merchandising.categories}`
      ).pipe(shareReplay(1));
    }
    return this.categoriesCache$;
  }

  getBrands(category?: string): Observable<ApiResponse<unknown>> {
    const params = category ? new HttpParams().set('category', category) : undefined;
    return this.http.get<ApiResponse<unknown>>(
      `${API_BASE_URL}${API_ENDPOINTS.merchandising.brands}`,
      { params }
    );
  }

  getDeals(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.merchandising.deals}`
    );
  }

  getBestsellers(category?: string, limit?: number): Observable<ApiResponse<Product[]>> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (limit) params = params.set('limit', limit);
    return this.http.get<ApiResponse<Product[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.merchandising.bestsellers}`,
      { params }
    );
  }

  getRecentlyViewed(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.merchandising.recentlyViewed}`,
      { headers: this.authService.authHeaders }
    );
  }

  trackView(productId: string, sessionId?: string): Observable<ApiResponse<null>> {
    const body = sessionId ? { productId, sessionId } : { productId };
    return this.http.post<ApiResponse<null>>(
      `${API_BASE_URL}${API_ENDPOINTS.merchandising.viewEvent}`,
      body,
      { headers: this.authService.authHeaders }
    );
  }
}
