import { environment } from '../../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl;

export const API_ENDPOINTS = {
  auth: {
    register: '/auth/register',
    initiateRegistration: '/auth/initiate-registration',
    verifyRegistration: '/auth/verify-registration',
    login: '/auth/login',
    googleToken: '/auth/google/token',
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
    uploadImages: '/products/upload-images',
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
    cancel: (orderId: string) => `/orders/${orderId}/cancel`,
    adminUpdateStatus: (orderId: string) => `/orders/admin/${orderId}/status`,
  },
  reviews: {
    byProduct: (productId: string) => `/reviews/product/${productId}`,
    create: '/reviews',
    update: (reviewId: string) => `/reviews/${reviewId}`,
    delete: (reviewId: string) => `/reviews/${reviewId}`,
  },
  sellerOrders: {
    list: '/seller/orders',
    updateItemStatus: (orderId: string, itemId: string) =>
      `/seller/orders/${orderId}/items/${itemId}/status`,
  },
  payment: {
    createOrder: '/payment/create-order',
    verify: '/payment/verify',
    getByOrderId: (orderId: string) => `/payment/order/${orderId}`,
    refund: '/payment/refund',
  },
  wishlist: {
    get: '/wishlist',
    add: (productId: string) => `/wishlist/${productId}`,
    remove: (productId: string) => `/wishlist/${productId}`,
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
    stats: '/seller/stats',
  },
  adminSellers: {
    list: '/admin/sellers',
    approve: (sellerId: string) => `/admin/sellers/${sellerId}/approve`,
    reject: (sellerId: string) => `/admin/sellers/${sellerId}/reject`,
  },
  admin: {
    stats: '/admin/stats',
    users: '/admin/users',
    orders: '/admin/orders',
    listAdmins: '/admin/users/admins',
    createAdmin: '/admin/users/admins',
    categories: '/admin/categories',
    categoryById: (id: string) => `/admin/categories/${id}`,
  },
} as const;
