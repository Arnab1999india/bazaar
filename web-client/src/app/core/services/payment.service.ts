import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { ApiResponse, RazorpayOrderResponse } from '../models/api.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  createRazorpayOrder(amount?: number): Observable<ApiResponse<RazorpayOrderResponse>> {
    return this.http.post<ApiResponse<RazorpayOrderResponse>>(
      `${API_BASE_URL}${API_ENDPOINTS.payments.razorpayCreate}`,
      { amount },
      { headers: this.authService.authHeaders }
    );
  }

  verifyRazorpayPayment(payload: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): Observable<ApiResponse<{ verified: boolean }>> {
    return this.http.post<ApiResponse<{ verified: boolean }>>(
      `${API_BASE_URL}${API_ENDPOINTS.payments.razorpayVerify}`,
      payload,
      { headers: this.authService.authHeaders }
    );
  }
}
