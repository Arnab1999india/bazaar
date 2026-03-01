export interface IOrderItem {
  product: string;
  quantity: number;
  price: number;
  name: string; // Store product name at time of order
  imageUrl?: string; // Store product image
}

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  PROCESSING = "processing",
  PACKED = "packed",
  SHIPPED = "shipped",
  OUT_FOR_DELIVERY = "out_for_delivery",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  RETURNED = "returned",
  REFUNDED = "refunded",
}

export enum PaymentStatus {
  PENDING = "pending",
  AUTHORIZED = "authorized",
  CAPTURED = "captured",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export interface IShipmentTracking {
  carrier: string; // e.g., "Delhivery", "Blue Dart", "FedEx"
  trackingNumber: string;
  trackingUrl?: string;
  currentLocation?: string;
  estimatedDelivery?: Date;
  updates: Array<{
    status: string;
    location: string;
    timestamp: Date;
    description: string;
  }>;
}

export interface IReturnRequest {
  reason: string;
  description?: string;
  images?: string[];
  requestedAt: Date;
  status: "pending" | "approved" | "rejected" | "completed";
  approvedAt?: Date;
  rejectedAt?: Date;
  completedAt?: Date;
  refundAmount?: number;
  refundMethod?: "original" | "wallet" | "bank";
  adminNotes?: string;
}

export interface IOrder {
  id: string;
  orderNumber: string; // e.g., "ORD-2024-00001"
  items: IOrderItem[];
  buyer: string;
  seller?: string; // For marketplace model

  // Pricing
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  tax: number;
  totalAmount: number;

  // Status
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;

  // Shipping
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    landmark?: string;
  };

  billingAddress?: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };

  // Tracking
  shipmentTracking?: IShipmentTracking;

  // Timeline
  timeline: Array<{
    status: string;
    timestamp: Date;
    description: string;
    updatedBy?: string; // User ID who made the update
  }>;

  // Returns
  returnRequest?: IReturnRequest;

  // Notes
  customerNotes?: string;
  sellerNotes?: string;
  adminNotes?: string;

  // Dates
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderInput {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    landmark?: string;
  };
  billingAddress?: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  paymentMethod: string;
  customerNotes?: string;
}

export interface IOrderQuery {
  buyer?: string;
  seller?: string;
  status?: OrderStatus | OrderStatus[];
  paymentStatus?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string; // Search by order number, customer name, etc.
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "totalAmount" | "status";
  sortOrder?: "asc" | "desc";
}

export interface IReturnRequestInput {
  orderId: string;
  reason: string;
  description?: string;
  images?: string[];
}

export interface IShipmentUpdate {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
}
