import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { ApiResponse, Product, StoreOverview } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class StoreService {
  constructor(private http: HttpClient) {}

  getStoreOverview(sellerId: string): Observable<ApiResponse<StoreOverview>> {
    return this.http.get<ApiResponse<StoreOverview>>(
      `${API_BASE_URL}${API_ENDPOINTS.stores.overview(sellerId)}`
    );
  }

  getStoreProducts(
    sellerId: string,
    options: { sort?: string; page?: number; limit?: number } = {}
  ): Observable<ApiResponse<Product[]>> {
    let params = new HttpParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<ApiResponse<Product[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.stores.catalog(sellerId)}`,
      { params }
    );
  }
}
