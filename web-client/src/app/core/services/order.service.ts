import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { ApiResponse, Order, OrderCreatePayload } from '../models/api.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  createOrder(payload: OrderCreatePayload): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(
      `${API_BASE_URL}${API_ENDPOINTS.orders.create}`,
      payload,
      { headers: this.authService.authHeaders }
    );
  }

  listOrders(status?: string, page = 1, limit = 10): Observable<ApiResponse<{ orders: Order[]; total: number }>> {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    if (status && status !== 'all') params = params.set('status', status);
    return this.http.get<ApiResponse<{ orders: Order[]; total: number }>>(
      `${API_BASE_URL}${API_ENDPOINTS.orders.list}`,
      { params, headers: this.authService.authHeaders }
    );
  }

  getOrderById(orderId: string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(
      `${API_BASE_URL}${API_ENDPOINTS.orders.detail(orderId)}`,
      { headers: this.authService.authHeaders }
    );
  }

  cancelOrder(orderId: string): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(
      `${API_BASE_URL}${API_ENDPOINTS.orders.cancel(orderId)}`,
      {},
      { headers: this.authService.authHeaders }
    );
  }
}
