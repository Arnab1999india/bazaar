import mongoose, { Schema, Document, Model } from "mongoose";
import { IPaymentOrder } from "../interfaces/payment.interface";

export interface IPaymentDocument extends Omit<IPaymentOrder, "id">, Document {}

const paymentSchema = new Schema<IPaymentDocument>(
  {
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    orderId: {
      type: String,
      ref: "Order",
      required: true,
    },
    userId: {
      type: String,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["created", "authorized", "captured", "failed", "refunded"],
      default: "created",
    },
    razorpayPaymentId: String,
    razorpaySignature: String,
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

export const Payment = mongoose.model<IPaymentDocument>(
  "Payment",
  paymentSchema,
);
