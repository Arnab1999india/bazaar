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
  AuthUser,
  LoginPayload,
  RegisterPayload,
  RegistrationInitiatePayload,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'bazaar.auth';
  private readonly userKey = 'bazaar.user';
  private readonly authStateSubject = new BehaviorSubject<boolean>(
    this.hasTokens()
  );
  readonly authState$ = this.authStateSubject.asObservable();
  private readonly userSubject = new BehaviorSubject<AuthUser | null>(
    this.getStoredUser()
  );
  readonly user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {}

  register(payload: RegisterPayload): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${API_BASE_URL}${API_ENDPOINTS.auth.register}`,
      payload
    );
  }

  initiateRegistration(
    payload: RegistrationInitiatePayload
  ): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(
      `${API_BASE_URL}${API_ENDPOINTS.auth.initiateRegistration}`,
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
          this.persistSession(res.data, remember);
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
          this.clearSession();
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
    this.clearSession();
  }

  persistSessionFromToken(
    user: AuthUser,
    token: string,
    remember = true
  ): void {
    this.persistSession(
      {
        user,
        tokens: { accessToken: token },
      },
      remember
    );
  }

  isAuthenticated(): boolean {
    return this.hasTokens();
  }

  getCurrentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  private hasTokens(): boolean {
    const stored =
      localStorage.getItem(this.storageKey) ??
      sessionStorage.getItem(this.storageKey);
    return Boolean(stored);
  }

  private persistSession(response: AuthResponse, remember = true): void {
    this.persistTokens(response.tokens, remember);
    this.persistUser(response.user, remember);
    this.authStateSubject.next(true);
  }

  private persistUser(user: AuthUser, remember = true): void {
    localStorage.removeItem(this.userKey);
    sessionStorage.removeItem(this.userKey);
    const targetStorage = remember ? localStorage : sessionStorage;
    targetStorage.setItem(this.userKey, JSON.stringify(user));
    this.userSubject.next(user);
  }

  private clearSession(): void {
    this.clearTokens();
    localStorage.removeItem(this.userKey);
    sessionStorage.removeItem(this.userKey);
    this.userSubject.next(null);
  }

  private getStoredUser(): AuthUser | null {
    const stored =
      localStorage.getItem(this.userKey) ??
      sessionStorage.getItem(this.userKey);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  }
}
