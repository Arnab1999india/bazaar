export interface IPaymentOrder {
  id: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  orderId: string; // Reference to main order
  userId: string;
  status: "created" | "authorized" | "captured" | "failed";
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreatePaymentOrderInput {
  orderId: string;
  amount: number;
  currency?: string;
}

export interface IVerifyPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}
