import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  listOrders(): Observable<ApiResponse<{ orders: Order[] }>> {
    return this.http.get<ApiResponse<{ orders: Order[] }>>(
      `${API_BASE_URL}${API_ENDPOINTS.orders.list}`,
      { headers: this.authService.authHeaders }
    );
  }
}
