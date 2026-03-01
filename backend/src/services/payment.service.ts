import crypto from "crypto";
import { razorpayInstance } from "../config/razorpay.config";
import { Payment } from "../models/Payment";
import { Order } from "../models/Order";
import { AppError, ErrorType } from "../interfaces/error.interface";
import {
  ICreatePaymentOrderInput,
  IVerifyPaymentInput,
} from "../interfaces/payment.interface";

export class PaymentService {
  static async createPaymentOrder(
    userId: string,
    data: ICreatePaymentOrderInput,
  ) {
    try {
      // Verify order exists and belongs to user
      const order = await Order.findById(data.orderId);
      if (!order) {
        throw new AppError(ErrorType.NOT_FOUND, "Order not found", 404);
      }
      if (order.buyer.toString() !== userId) {
        throw new AppError(ErrorType.AUTHORIZATION, "Access denied", 403);
      }

      // Create Razorpay order
      const razorpayOrder = await razorpayInstance.orders.create({
        amount: data.amount * 100, // Convert to paise
        currency: data.currency || "INR",
        receipt: `order_${data.orderId}`,
        notes: {
          orderId: data.orderId,
          userId: userId,
        },
      });

      // Save payment record
      const payment = await Payment.create({
        razorpayOrderId: razorpayOrder.id,
        amount: data.amount,
        currency: data.currency || "INR",
        orderId: data.orderId,
        userId: userId,
        status: "created",
      });

      return {
        paymentId: payment.id,
        razorpayOrderId: razorpayOrder.id,
        amount: data.amount,
        currency: data.currency || "INR",
        key: process.env.RAZORPAY_KEY_ID,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorType.INTERNAL,
        "Failed to create payment order",
        500,
      );
    }
  }

  static async verifyPayment(data: IVerifyPaymentInput) {
    try {
      // Verify signature
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
        .digest("hex");

      if (generatedSignature !== data.razorpaySignature) {
        throw new AppError(
          ErrorType.VALIDATION,
          "Invalid payment signature",
          400,
        );
      }

      // Update payment status
      const payment = await Payment.findOne({
        razorpayOrderId: data.razorpayOrderId,
      });

      if (!payment) {
        throw new AppError(ErrorType.NOT_FOUND, "Payment not found", 404);
      }

      payment.razorpayPaymentId = data.razorpayPaymentId;
      payment.razorpaySignature = data.razorpaySignature;
      payment.status = "captured";
      await payment.save();

      // Update order payment status
      await Order.findByIdAndUpdate(payment.orderId, {
        paymentStatus: "completed",
        status: "processing",
      });

      return {
        success: true,
        message: "Payment verified successfully",
        payment: payment.toJSON(),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Failed to verify payment", 500);
    }
  }

  static async getPaymentByOrderId(orderId: string, userId: string) {
    try {
      const payment = await Payment.findOne({ orderId, userId });
      if (!payment) {
        throw new AppError(ErrorType.NOT_FOUND, "Payment not found", 404);
      }
      return payment.toJSON();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Failed to fetch payment", 500);
    }
  }
}
