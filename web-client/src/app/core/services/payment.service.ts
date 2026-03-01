import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { ApiResponse } from '../models/api.models';
import { AuthService } from './auth.service';

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface CreatePaymentOrderResponse {
  paymentId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  createPaymentOrder(
    orderId: string,
    amount: number,
    currency: string = 'INR',
  ): Observable<ApiResponse<CreatePaymentOrderResponse>> {
    return this.http.post<ApiResponse<CreatePaymentOrderResponse>>(
      `${API_BASE_URL}${API_ENDPOINTS.payment.createOrder}`,
      { orderId, amount, currency },
      { headers: this.authService.authHeaders },
    );
  }

  verifyPayment(data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${API_BASE_URL}${API_ENDPOINTS.payment.verify}`,
      data,
      { headers: this.authService.authHeaders },
    );
  }

  getPaymentByOrderId(orderId: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${API_BASE_URL}${API_ENDPOINTS.payment.getByOrderId(orderId)}`,
      { headers: this.authService.authHeaders },
    );
  }

  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  openRazorpayCheckout(options: RazorpayOptions): void {
    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  }
}
