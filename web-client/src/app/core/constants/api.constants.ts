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
  cart: {
    get: '/cart',
    add: '/cart/add',
    updateItem: (productId: string) => `/cart/item/${productId}`,
    removeItem: (productId: string) => `/cart/item/${productId}`,
    clear: '/cart/clear',
    count: '/cart/count',
  },
  orders: {
    create: '/orders',
    list: '/orders',
    detail: (orderId: string) => `/orders/${orderId}`,
  },
  sellerOrders: {
    list: '/seller/orders',
    updateItemStatus: (orderId: string, itemId: string) =>
      `/seller/orders/${orderId}/items/${itemId}/status`,
  },
  payments: {
    razorpayCreate: '/payments/razorpay/create-order',
    razorpayVerify: '/payments/razorpay/verify',
  },
  users: {
    me: '/users/me',
    profile: '/users/profile',
    search: '/users/search',
    suggestions: '/users/suggestions',
  },
  sellers: {
    me: '/sellers/me',
    onboard: '/sellers/onboard',
    update: '/sellers/me',
  },
  adminSellers: {
    list: '/admin/sellers',
    approve: (sellerId: string) => `/admin/sellers/${sellerId}/approve`,
    reject: (sellerId: string) => `/admin/sellers/${sellerId}/reject`,
  },
} as const;
