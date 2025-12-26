import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import {
  ApiResponse,
  AuthUser,
  UserProfileUpdate,
} from '../models/api.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  getCurrentUser(): Observable<ApiResponse<AuthUser>> {
    return this.http.get<ApiResponse<AuthUser>>(
      `${API_BASE_URL}${API_ENDPOINTS.users.me}`,
      { headers: this.authHeaders }
    );
  }

  updateProfile(
    payload: UserProfileUpdate
  ): Observable<ApiResponse<AuthUser>> {
    return this.http.patch<ApiResponse<AuthUser>>(
      `${API_BASE_URL}${API_ENDPOINTS.users.profile}`,
      payload,
      { headers: this.authHeaders }
    );
  }

  searchByUsername(username: string): Observable<ApiResponse<AuthUser[]>> {
    const params = new HttpParams().set('username', username);
    return this.http.get<ApiResponse<AuthUser[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.users.search}`,
      { params }
    );
  }

  getSuggestions(limit = 10): Observable<ApiResponse<AuthUser[]>> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<ApiResponse<AuthUser[]>>(
      `${API_BASE_URL}${API_ENDPOINTS.users.suggestions}`,
      { params }
    );
  }

  private get authHeaders(): HttpHeaders {
    return this.authService.authHeaders;
  }
}
