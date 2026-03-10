import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { ApiResponse, AdminStats, AdminUser, Order } from '../models/api.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  getPlatformStats(): Observable<ApiResponse<AdminStats>> {
    return this.http.get<ApiResponse<AdminStats>>(
      `${API_BASE_URL}${API_ENDPOINTS.admin.stats}`,
      { headers: this.authService.authHeaders }
    );
  }

  listUsers(role?: string, page = 1, limit = 20): Observable<ApiResponse<AdminUser[]>> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (role && role !== 'all') params = params.set('role', role);
    return this.http.get<ApiResponse<AdminUser[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.admin.users}`,
      { params, headers: this.authService.authHeaders }
    );
  }

  listOrders(status?: string, page = 1, limit = 20): Observable<ApiResponse<Order[]>> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (status && status !== 'all') params = params.set('status', status);
    return this.http.get<ApiResponse<Order[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.admin.orders}`,
      { params, headers: this.authService.authHeaders }
    );
  }

  listAdmins(): Observable<ApiResponse<AdminUser[]>> {
    return this.http.get<ApiResponse<AdminUser[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.admin.listAdmins}`,
      { headers: this.authService.authHeaders }
    );
  }

  createAdmin(payload: { name: string; email: string; password: string }): Observable<ApiResponse<AdminUser>> {
    return this.http.post<ApiResponse<AdminUser>>(
      `${API_BASE_URL}${API_ENDPOINTS.admin.createAdmin}`,
      payload,
      { headers: this.authService.authHeaders }
    );
  }
}
