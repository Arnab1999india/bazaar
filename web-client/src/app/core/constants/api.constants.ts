import { environment } from '../../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl;

export const API_ENDPOINTS = {
  auth: {
    register: '/auth/register',
    initiateRegistration: '/auth/initiate-registration',
    verifyRegistration: '/auth/verify-registration',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    changePassword: '/auth/change-password',
    passwordResetRequest: '/auth/password-reset-request',
    verifyPasswordResetOtp: '/auth/verify-password-reset-otp',
    resetPassword: '/auth/reset-password',
    resendOtp: '/auth/resend-otp',
  },
  products: {
    list: '/products',
    detail: (productId: string) => `/products/${productId}`,
    variants: (productId: string) => `/products/${productId}/variants`,
    recommendations: (productId: string) =>
      `/products/${productId}/recommendations`,
    create: '/products',
    update: (productId: string) => `/products/${productId}`,
    delete: (productId: string) => `/products/${productId}`,
  },
  merchandising: {
    categories: '/categories',
    brands: '/brands',
    deals: '/deals',
    bestsellers: '/bestsellers',
    recentlyViewed: '/recently-viewed',
    viewEvent: '/events/view',
  },
  stores: {
    overview: (sellerId: string) => `/stores/${sellerId}`,
    catalog: (sellerId: string) => `/stores/${sellerId}/products`,
  },
  users: {
    me: '/users/me',
    profile: '/users/profile',
    search: '/users/search',
    suggestions: '/users/suggestions',
  },
} as const;
