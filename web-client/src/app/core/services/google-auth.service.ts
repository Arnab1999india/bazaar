import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { ApiResponse } from '../models/api.models';
import { AuthService } from './auth.service';

declare const google: any;

@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private initialized = false;

  constructor(private http: HttpClient, private authService: AuthService) {}

  /** Initialize Google Identity Services. Call once in the component. */
  initialize(clientId: string): void {
    if (this.initialized || typeof google === 'undefined') return;
    this.initialized = true;
    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential: string }) => {
        this.handleCredential(response.credential).subscribe({
          next: (res) => this.authService.persistSessionFromResponse(res),
          error: (err) => console.error('Google login failed', err),
        });
      },
    });
  }

  /** Trigger the Google One Tap / popup prompt. */
  prompt(): void {
    if (typeof google === 'undefined') return;
    google.accounts.id.prompt();
  }

  /** Render a standard Google Sign-In button inside `element`. */
  renderButton(element: HTMLElement): void {
    if (typeof google === 'undefined') return;
    google.accounts.id.renderButton(element, {
      type: 'standard',
      shape: 'rectangular',
      theme: 'outline',
      text: 'signin_with',
      size: 'large',
      width: '100%',
    });
  }

  /** Send id_token to backend and get JWT pair. */
  loginWithToken(idToken: string): Observable<ApiResponse<{ token: { accessToken: string; refreshToken: string }; user: any }>> {
    return this.http.post<any>(
      `${API_BASE_URL}${API_ENDPOINTS.auth.googleToken}`,
      { idToken }
    );
  }

  private handleCredential(idToken: string): Observable<any> {
    return this.loginWithToken(idToken);
  }
}
