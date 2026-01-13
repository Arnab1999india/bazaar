import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import {
  ApiResponse,
  Product,
  ProductCreatePayload,
  ProductFilters,
  ProductUpdatePayload,
  ProductVariant,
} from '../models/api.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  listProducts(
    filters: ProductFilters = {}
  ): Observable<ApiResponse<Product[]>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === 'attributes' && typeof value === 'object') {
        Object.entries(value as Record<string, unknown>).forEach(
          ([attrKey, attrVal]) => {
            params = params.append(`attributes[${attrKey}]`, String(attrVal));
          }
        );
      } else {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<ApiResponse<Product[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.products.list}`,
      { params }
    );
  }

  getProduct(productId: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(
      `${API_BASE_URL}${API_ENDPOINTS.products.detail(productId)}`
    );
  }

  getVariants(productId: string): Observable<ApiResponse<ProductVariant[]>> {
    return this.http.get<ApiResponse<ProductVariant[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.products.variants(productId)}`
    );
  }

  getRecommendations(
    productId: string,
    limit = 6
  ): Observable<ApiResponse<Product[]>> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<ApiResponse<Product[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.products.recommendations(productId)}`,
      { params }
    );
  }

  createProduct(
    payload: ProductCreatePayload
  ): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(
      `${API_BASE_URL}${API_ENDPOINTS.products.create}`,
      payload,
      { headers: this.authService.authHeaders }
    );
  }

  updateProduct(
    productId: string,
    payload: ProductUpdatePayload
  ): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(
      `${API_BASE_URL}${API_ENDPOINTS.products.update(productId)}`,
      payload,
      { headers: this.authService.authHeaders }
    );
  }

  deleteProduct(productId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${API_BASE_URL}${API_ENDPOINTS.products.delete(productId)}`,
      { headers: this.authService.authHeaders }
    );
  }
}
