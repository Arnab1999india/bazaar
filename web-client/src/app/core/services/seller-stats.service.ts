import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { ApiResponse, SellerStats } from '../models/api.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SellerStatsService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  getStats(): Observable<ApiResponse<SellerStats>> {
    return this.http.get<ApiResponse<SellerStats>>(
      `${API_BASE_URL}${API_ENDPOINTS.sellers.stats}`,
      { headers: this.authService.authHeaders }
    );
  }
}
