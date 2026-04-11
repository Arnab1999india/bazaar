import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { ApiResponse, SellerProfile } from '../models/api.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminSellerService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  listSellers(
    status?: 'pending' | 'approved' | 'rejected',
    page = 1,
    limit = 25
  ): Observable<ApiResponse<SellerProfile[]>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ApiResponse<SellerProfile[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.adminSellers.list}`,
      { params, headers: this.authService.authHeaders }
    );
  }

  approveSeller(sellerId: string): Observable<ApiResponse<SellerProfile>> {
    return this.http.patch<ApiResponse<SellerProfile>>(
      `${API_BASE_URL}${API_ENDPOINTS.adminSellers.approve(sellerId)}`,
      {},
      { headers: this.authService.authHeaders }
    );
  }

  rejectSeller(
    sellerId: string,
    reason: string
  ): Observable<ApiResponse<SellerProfile>> {
    return this.http.patch<ApiResponse<SellerProfile>>(
      `${API_BASE_URL}${API_ENDPOINTS.adminSellers.reject(sellerId)}`,
      { reason },
      { headers: this.authService.authHeaders }
    );
  }
}
