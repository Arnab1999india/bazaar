export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

// Auth
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: 'customer' | 'seller' | 'admin' | 'buyer';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface RegistrationInitiatePayload {
  name: string;
  email: string;
  password: string;
  role?: 'customer' | 'seller' | 'admin';
  phone?: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

// Products
export interface ProductAttribute {
  name: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  brand: string;
  description?: string;
  imageUrl?: string[];
  rating?: number;
  stockStatus?: string;
  totalStock?: number;
  tags?: string[];
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
}

export interface ProductVariant {
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface ProductFilters {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  ratingGte?: number;
  sort?: 'price' | 'rating' | 'createdAt' | 'relevance' | 'bestseller';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  attributes?: Record<string, string | number | boolean>;
}

export interface ProductCreatePayload {
  name: string;
  description?: string;
  price: number;
  category: string;
  brand?: string;
  imageUrl: string[];
  stockStatus?: 'in-stock' | 'out-of-stock';
  variants?: ProductVariant[];
}

export interface ProductUpdatePayload
  extends Partial<Omit<ProductCreatePayload, 'variants'>> {
  variants?: ProductVariant[];
}

// Stores
export interface StoreOverview {
  id: string;
  name: string;
  profileImageUrl?: string;
  productCount: number;
  averageRating: number;
  totalSales: number;
  totalRevenue: number;
}

// Users
export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  bio?: string;
  dateOfBirth?: string;
  locationCity?: string;
  locationCountry?: string;
  educationSchool?: string;
  educationCollege?: string;
  profileImageUrl?: string;
}

// Sellers
export type SellerProfileStatus = 'pending' | 'approved' | 'rejected';

export interface SellerAddress {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface SellerDocument {
  type: string;
  url: string;
}

export interface SellerProfile {
  id: string;
  user: string;
  businessName: string;
  legalName?: string | null;
  businessType: string;
  phone: string;
  gstNumber?: string | null;
  panNumber?: string | null;
  shopAddress: SellerAddress;
  warehouseAddress?: SellerAddress | null;
  kycDocuments: SellerDocument[];
  status: SellerProfileStatus;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SellerProfileInput {
  businessName: string;
  legalName?: string;
  businessType: string;
  phone: string;
  gstNumber?: string;
  panNumber?: string;
  shopAddress: SellerAddress;
  warehouseAddress?: SellerAddress;
  kycDocuments?: SellerDocument[];
}
