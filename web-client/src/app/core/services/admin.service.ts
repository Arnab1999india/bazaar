import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { ApiResponse, AdminStats, AdminUser, Category, Order } from '../models/api.models';
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

  updateOrderStatus(orderId: string, status: string): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(
      `${API_BASE_URL}${API_ENDPOINTS.orders.adminUpdateStatus(orderId)}`,
      { status },
      { headers: this.authService.authHeaders }
    );
  }

  // ── Category management ──────────────────────────────────
  listCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.admin.categories}`,
      { headers: this.authService.authHeaders }
    );
  }

  createCategory(payload: { name: string; slug?: string; parentId?: string | null }): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(
      `${API_BASE_URL}${API_ENDPOINTS.admin.categories}`,
      payload,
      { headers: this.authService.authHeaders }
    );
  }

  updateCategory(id: string, payload: { name: string; slug?: string; parentId?: string | null }): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(
      `${API_BASE_URL}${API_ENDPOINTS.admin.categoryById(id)}`,
      payload,
      { headers: this.authService.authHeaders }
    );
  }

  deleteCategory(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${API_BASE_URL}${API_ENDPOINTS.admin.categoryById(id)}`,
      { headers: this.authService.authHeaders }
    );
  }
}
