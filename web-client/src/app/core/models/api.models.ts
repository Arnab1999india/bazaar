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

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  count: number;
  children: Category[];
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
  _id?: string;
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
  totalStock?: number;
  variants?: ProductVariant[];
}

export interface ProductUpdatePayload
  extends Partial<Omit<ProductCreatePayload, 'variants'>> {
  variants?: ProductVariant[];
}

// Cart
export interface CartLineItem {
  product: Product;
  quantity: number;
}

export interface CartResponse {
  id: string;
  items: CartLineItem[];
  totalItems: number;
  totalAmount: number;
}

// Orders
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export type OrderItemStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderTimeline {
  status: string;
  timestamp: string;
  description: string;
  updatedBy?: string;
}

export interface ShipmentUpdate {
  status: string;
  location?: string;
  timestamp: string;
  description?: string;
}

export interface ShipmentTracking {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  currentLocation?: string;
  estimatedDelivery?: string;
  updates?: ShipmentUpdate[];
}

export interface OrderItem {
  id: string;
  _id?: string;
  product: Product | { id: string; name: string; imageUrl?: string[]; price?: number };
  sellerId: string;
  quantity: number;
  price: number;
  name?: string;
  imageUrl?: string;
  itemStatus: OrderItemStatus;
}

export interface Order {
  id: string;
  _id?: string;
  orderNumber?: string;
  items: OrderItem[];
  buyer: { id: string; name: string; email: string } | string;
  totalAmount: number;
  subtotal?: number;
  discount?: number;
  deliveryCharge?: number;
  tax?: number;
  status: OrderStatus;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  paymentProvider?: string;
  paymentId?: string;
  paymentSignature?: string;
  razorpayOrderId?: string;
  shippingAddress: {
    fullName?: string;
    phone?: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  shipmentTracking?: ShipmentTracking;
  timeline?: OrderTimeline[];
  createdAt: string;
  updatedAt: string;
}

// Reviews
export interface Review {
  id: string;
  user: { id: string; name: string } | string;
  product: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderCreatePayload {
  items?: Array<{ productId: string; quantity: number }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  paymentMethod: string;
  paymentProvider?: string;
  paymentId?: string;
  paymentSignature?: string;
  razorpayOrderId?: string;
}

// Payments
export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
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

// Seller Stats
export interface SellerStats {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    totalProducts: number;
  };
  weekly: { orders: number; revenue: number };
  monthly: {
    orders: number;
    revenue: number;
    lastMonthRevenue: number;
    growthRate: string | null;
  };
  ordersByStatus: {
    pending: number;
    confirmed: number;
    processing: number;
    packed: number;
    shipped: number;
    outForDelivery: number;
    delivered: number;
    cancelled: number;
    returned: number;
    refunded: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    buyer: { name: string; email: string } | string;
  }>;
}

// Admin Stats
export interface AdminStats {
  users: { total: number; sellers: number; buyers: number };
  sellers: { pending: number; approved: number };
  orders: {
    total: number;
    weekly: number;
    monthly: number;
    byStatus: Record<string, number>;
  };
  revenue: {
    total: number;
    weekly: number;
    monthly: number;
    avgOrderValue: number;
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
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
