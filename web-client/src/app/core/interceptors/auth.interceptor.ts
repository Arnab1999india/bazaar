import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, finalize, switchMap, take } from 'rxjs/operators';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { AuthService } from '../services/auth.service';

// Module-level singletons — one refresh at a time, queuing concurrent 401s
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

const REFRESH_URL = `${API_BASE_URL}${API_ENDPOINTS.auth.refresh}`;

function cloneWithToken(
  req: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function loginRouteForRole(role?: string): string {
  if (role === 'seller') return '/auth/seller-login';
  if (role === 'admin') return '/auth/admin-login';
  return '/auth/login';
}

function handleRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<HttpEvent<unknown>> {
  // Another request already kicked off a refresh — queue behind it
  if (isRefreshing) {
    return refreshTokenSubject.pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((newToken) => next(cloneWithToken(req, newToken)))
    );
  }

  isRefreshing = true;
  refreshTokenSubject.next(null);

  const refreshToken = authService.getRefreshToken();
  if (!refreshToken) {
    isRefreshing = false;
    authService.signOut();
    router.navigate([loginRouteForRole(authService.getCurrentUser()?.role)]);
    return throwError(() => new Error('No refresh token available'));
  }

  return authService.refresh(refreshToken).pipe(
    switchMap((response) => {
      const tokens = response.data;
      authService.updateTokensInPlace(tokens);
      refreshTokenSubject.next(tokens.accessToken);
      return next(cloneWithToken(req, tokens.accessToken));
    }),
    catchError((err) => {
      const role = authService.getCurrentUser()?.role;
      authService.signOut();
      router.navigate([loginRouteForRole(role)]);
      return throwError(() => err);
    }),
    finalize(() => {
      isRefreshing = false;
    })
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Attach the current access token (if any) to every outgoing request
  const accessToken = authService.getAccessToken();
  const outgoing = accessToken ? cloneWithToken(req, accessToken) : req;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // The refresh endpoint itself returned 401 — log out immediately
      if (req.url.startsWith(REFRESH_URL)) {
        const role = authService.getCurrentUser()?.role;
        authService.signOut();
        router.navigate([loginRouteForRole(role)]);
        return throwError(() => error);
      }

      return handleRefresh(outgoing, next, authService, router);
    })
  );
};
