import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { ApiResponse, Order } from '../models/api.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SellerOrderService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  listSellerOrders(): Observable<
    ApiResponse<{ orders: Order[]; total: number; page: number; limit: number }>
  > {
    return this.http.get<
      ApiResponse<{ orders: Order[]; total: number; page: number; limit: number }>
    >(
      `${API_BASE_URL}${API_ENDPOINTS.sellerOrders.list}`,
      { headers: this.authService.authHeaders }
    );
  }

  updateItemStatus(
    orderId: string,
    itemId: string,
    status: string
  ): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(
      `${API_BASE_URL}${API_ENDPOINTS.sellerOrders.updateItemStatus(
        orderId,
        itemId
      )}`,
      { status },
      { headers: this.authService.authHeaders }
    );
  }
}
