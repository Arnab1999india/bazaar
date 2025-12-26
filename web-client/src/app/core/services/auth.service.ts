import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import {
  API_BASE_URL,
  API_ENDPOINTS,
} from '../constants/api.constants';
import {
  ApiResponse,
  AuthResponse,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'bazaar.auth';
  private readonly authStateSubject = new BehaviorSubject<boolean>(
    this.hasTokens()
  );
  readonly authState$ = this.authStateSubject.asObservable();

  constructor(private http: HttpClient) {}

  register(payload: RegisterPayload): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${API_BASE_URL}${API_ENDPOINTS.auth.register}`,
      payload
    );
  }

  login(
    payload: LoginPayload,
    remember = true
  ): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(
        `${API_BASE_URL}${API_ENDPOINTS.auth.login}`,
        payload
      )
      .pipe(
        tap((res) => {
          this.persistTokens(res.data.tokens, remember);
          this.authStateSubject.next(true);
        })
      );
  }

  requestPasswordReset(email: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${API_BASE_URL}${API_ENDPOINTS.auth.passwordResetRequest}`,
      { email }
    );
  }

  verifyPasswordResetOtp(payload: {
    email: string;
    otp: string;
    purpose: 'password-reset' | 'registration';
  }): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${API_BASE_URL}${API_ENDPOINTS.auth.verifyPasswordResetOtp}`,
      payload
    );
  }

  verifyRegistrationOtp(payload: {
    email: string;
    otp: string;
    purpose: 'registration';
  }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${API_BASE_URL}${API_ENDPOINTS.auth.verifyRegistration}`,
      payload
    );
  }

  resendOtp(payload: {
    email: string;
    purpose: 'password-reset' | 'registration';
  }): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${API_BASE_URL}${API_ENDPOINTS.auth.resendOtp}`,
      payload
    );
  }

  resetPassword(payload: {
    email: string;
    newPassword: string;
  }): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${API_BASE_URL}${API_ENDPOINTS.auth.resetPassword}`,
      payload
    );
  }

  refresh(refreshToken: string): Observable<ApiResponse<AuthTokens>> {
    return this.http.post<ApiResponse<AuthTokens>>(
      `${API_BASE_URL}${API_ENDPOINTS.auth.refresh}`,
      { refreshToken }
    );
  }

  logout(): Observable<ApiResponse<null>> {
    return this.http
      .post<ApiResponse<null>>(
        `${API_BASE_URL}${API_ENDPOINTS.auth.logout}`,
        {},
        { headers: this.authHeaders }
      )
      .pipe(
        tap(() => {
          this.clearTokens();
          this.authStateSubject.next(false);
        })
      );
  }

  changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${API_BASE_URL}${API_ENDPOINTS.auth.changePassword}`,
      payload,
      { headers: this.authHeaders }
    );
  }

  get authHeaders(): HttpHeaders {
    const tokens = this.getTokens();
    return tokens?.accessToken
      ? new HttpHeaders({
          Authorization: `Bearer ${tokens.accessToken}`,
        })
      : new HttpHeaders();
  }

  getTokens(): AuthTokens | null {
    const stored =
      localStorage.getItem(this.storageKey) ??
      sessionStorage.getItem(this.storageKey);
    return stored ? (JSON.parse(stored) as AuthTokens) : null;
  }

  persistTokens(tokens?: AuthTokens, remember = true): void {
    if (!tokens) return;
    localStorage.removeItem(this.storageKey);
    sessionStorage.removeItem(this.storageKey);
    const targetStorage = remember ? localStorage : sessionStorage;
    targetStorage.setItem(this.storageKey, JSON.stringify(tokens));
  }

  clearTokens(): void {
    localStorage.removeItem(this.storageKey);
    sessionStorage.removeItem(this.storageKey);
    this.authStateSubject.next(false);
  }

  signOut(): void {
    this.clearTokens();
  }

  isAuthenticated(): boolean {
    return this.hasTokens();
  }

  private hasTokens(): boolean {
    const stored =
      localStorage.getItem(this.storageKey) ??
      sessionStorage.getItem(this.storageKey);
    return Boolean(stored);
  }
}
