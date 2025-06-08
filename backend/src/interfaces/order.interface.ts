export interface IOrderItem {
  product: string; // Reference to Product ID
  quantity: number;
  price: number; // Price at the time of order
}

export enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export interface IOrder {
  id: string;
  items: IOrderItem[];
  buyer: string; // Reference to User ID
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  paymentStatus: "pending" | "completed" | "failed";
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderInput {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  paymentMethod: string;
}

export interface IOrderQuery {
  buyer?: string;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}
