import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import {
  ApiResponse,
  SellerProfile,
  SellerProfileInput,
} from '../models/api.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SellerService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  getMyProfile(): Observable<ApiResponse<SellerProfile>> {
    return this.http.get<ApiResponse<SellerProfile>>(
      `${API_BASE_URL}${API_ENDPOINTS.sellers.me}`,
      { headers: this.authService.authHeaders }
    );
  }

  onboard(payload: SellerProfileInput): Observable<ApiResponse<SellerProfile>> {
    return this.http.post<ApiResponse<SellerProfile>>(
      `${API_BASE_URL}${API_ENDPOINTS.sellers.onboard}`,
      payload,
      { headers: this.authService.authHeaders }
    );
  }

  updateProfile(
    payload: Partial<SellerProfileInput>
  ): Observable<ApiResponse<SellerProfile>> {
    return this.http.patch<ApiResponse<SellerProfile>>(
      `${API_BASE_URL}${API_ENDPOINTS.sellers.update}`,
      payload,
      { headers: this.authService.authHeaders }
    );
  }
}
