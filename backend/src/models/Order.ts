import mongoose, { Schema, Document, Model } from "mongoose";
import {
  IOrder,
  OrderStatus,
  PaymentStatus,
  IShipmentTracking,
  IReturnRequest,
} from "../interfaces/order.interface";

export interface IOrderDocument extends Omit<IOrder, "id">, Document {
  addTimelineEntry(
    status: string,
    description: string,
    userId?: string,
  ): Promise<void>;
  updateStatus(status: OrderStatus, userId?: string): Promise<void>;
  generateOrderNumber(): Promise<string>;
}

export interface IOrderModel extends Model<IOrderDocument> {
  findByBuyer(buyerId: string): Promise<IOrderDocument[]>;
  findBySeller(sellerId: string): Promise<IOrderDocument[]>;
  findByStatus(status: OrderStatus): Promise<IOrderDocument[]>;
  getOrderStats(userId?: string, role?: string): Promise<any>;
}

const shipmentTrackingSchema = new Schema<IShipmentTracking>({
  carrier: String,
  trackingNumber: String,
  trackingUrl: String,
  currentLocation: String,
  estimatedDelivery: Date,
  updates: [
    {
      status: String,
      location: String,
      timestamp: Date,
      description: String,
    },
  ],
});

const returnRequestSchema = new Schema<IReturnRequest>({
  reason: { type: String, required: true },
  description: String,
  images: [String],
  requestedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "completed"],
    default: "pending",
  },
  approvedAt: Date,
  rejectedAt: Date,
  completedAt: Date,
  refundAmount: Number,
  refundMethod: {
    type: String,
    enum: ["original", "wallet", "bank"],
  },
  adminNotes: String,
});

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    items: [
      {
        product: {
          type: String,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        name: String,
        imageUrl: String,
      },
    ],
    buyer: {
      type: String,
      ref: "User",
      required: true,
      index: true,
    },
    seller: {
      type: String,
      ref: "User",
      index: true,
    },

    // Pricing
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    deliveryCharge: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    // Status
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },

    // Shipping
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      zipCode: { type: String, required: true },
      landmark: String,
    },

    billingAddress: {
      fullName: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },

    // Tracking
    shipmentTracking: shipmentTrackingSchema,

    // Timeline
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        description: { type: String, required: true },
        updatedBy: {
          type: String,
          ref: "User",
        },
      },
    ],

    // Returns
    returnRequest: returnRequestSchema,

    // Notes
    customerNotes: String,
    sellerNotes: String,
    adminNotes: String,

    // Dates
    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

// Generate order number
orderSchema.methods.generateOrderNumber = async function (): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  // Count orders in current month
  const Model = this.constructor as import("mongoose").Model<any>;

  const count = await Model.countDocuments({
    createdAt: {
      $gte: new Date(year, date.getMonth(), 1),
      $lt: new Date(year, date.getMonth() + 1, 1),
    },
  });

  const orderNum = String(count + 1).padStart(5, "0");
  return `ORD-${year}${month}-${orderNum}`;
};

// Add timeline entry
orderSchema.methods.addTimelineEntry = async function (
  status: string,
  description: string,
  userId?: string,
): Promise<void> {
  this.timeline.push({
    status,
    timestamp: new Date(),
    description,
    updatedBy: userId,
  });
  await this.save();
};

// Update status with timeline
orderSchema.methods.updateStatus = async function (
  status: OrderStatus,
  userId?: string,
): Promise<void> {
  const oldStatus = this.status;
  this.status = status;

  // Update relevant date fields
  const now = new Date();
  switch (status) {
    case OrderStatus.CONFIRMED:
      this.confirmedAt = now;
      break;
    case OrderStatus.SHIPPED:
      this.shippedAt = now;
      break;
    case OrderStatus.DELIVERED:
      this.deliveredAt = now;
      break;
    case OrderStatus.CANCELLED:
      this.cancelledAt = now;
      break;
  }

  // Add timeline entry
  await this.addTimelineEntry(
    status,
    `Order status changed from ${oldStatus} to ${status}`,
    userId,
  );
};

// Static methods
orderSchema.statics.findByBuyer = function (
  buyerId: string,
): Promise<IOrderDocument[]> {
  return this.find({ buyer: buyerId })
    .sort({ createdAt: -1 })
    .populate("buyer", "name email")
    .populate("items.product", "name imageUrl");
};

orderSchema.statics.findBySeller = function (
  sellerId: string,
): Promise<IOrderDocument[]> {
  return this.find({ seller: sellerId })
    .sort({ createdAt: -1 })
    .populate("buyer", "name email")
    .populate("items.product", "name imageUrl");
};

orderSchema.statics.findByStatus = function (
  status: OrderStatus,
): Promise<IOrderDocument[]> {
  return this.find({ status })
    .sort({ createdAt: -1 })
    .populate("buyer", "name email")
    .populate("items.product", "name imageUrl");
};

orderSchema.statics.getOrderStats = async function (
  userId?: string,
  role?: string,
) {
  const match: any = {};

  if (userId && role === "seller") {
    match.seller = userId;
  } else if (userId && role === "customer") {
    match.buyer = userId;
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
        pendingOrders: {
          $sum: {
            $cond: [{ $eq: ["$status", OrderStatus.PENDING] }, 1, 0],
          },
        },
        completedOrders: {
          $sum: {
            $cond: [{ $eq: ["$status", OrderStatus.DELIVERED] }, 1, 0],
          },
        },
        cancelledOrders: {
          $sum: {
            $cond: [{ $eq: ["$status", OrderStatus.CANCELLED] }, 1, 0],
          },
        },
        avgOrderValue: { $avg: "$totalAmount" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      avgOrderValue: 0,
    }
  );
};

// Pre-save hook to generate order number
orderSchema.pre("save", async function (next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = await this.generateOrderNumber();

    // Add initial timeline entry
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      description: "Order created",
    });
  }
  next();
});

export const Order = mongoose.model<IOrderDocument, IOrderModel>(
  "Order",
  orderSchema,
);
