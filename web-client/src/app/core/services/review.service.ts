import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { ApiResponse, Review } from '../models/api.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  getReviewsByProduct(productId: string): Observable<ApiResponse<Review[]>> {
    return this.http.get<ApiResponse<Review[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.reviews.byProduct(productId)}`
    );
  }

  createReview(payload: { productId: string; rating: number; comment: string }): Observable<ApiResponse<Review>> {
    return this.http.post<ApiResponse<Review>>(
      `${API_BASE_URL}${API_ENDPOINTS.reviews.create}`,
      payload,
      { headers: this.authService.authHeaders }
    );
  }

  updateReview(reviewId: string, payload: { rating: number; comment: string }): Observable<ApiResponse<Review>> {
    return this.http.put<ApiResponse<Review>>(
      `${API_BASE_URL}${API_ENDPOINTS.reviews.update(reviewId)}`,
      payload,
      { headers: this.authService.authHeaders }
    );
  }

  deleteReview(reviewId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${API_BASE_URL}${API_ENDPOINTS.reviews.delete(reviewId)}`,
      { headers: this.authService.authHeaders }
    );
  }
}
