import { Response, NextFunction } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { envConfig } from "../config/env.config";
import { AppError, ErrorType } from "../interfaces/error.interface";
import { AuthRequest } from "../middlewares/auth.middleware";
import { CartService } from "../services/cart.service";

const getRazorpayClient = () => {
  if (!envConfig.RAZORPAY_KEY_ID || !envConfig.RAZORPAY_KEY_SECRET) {
    throw new AppError(
      ErrorType.INTERNAL,
      "Razorpay credentials are not configured",
      500
    );
  }

  return new Razorpay({
    key_id: envConfig.RAZORPAY_KEY_ID,
    key_secret: envConfig.RAZORPAY_KEY_SECRET,
  });
};

export class PaymentController {
  static async createRazorpayOrder(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          ErrorType.AUTHENTICATION,
          "Authentication required",
          401
        );
      }

      const razorpay = getRazorpayClient();
      const currency = String(req.body?.currency || "INR");
      const cart = await CartService.getCart(req.user.id);
      const baseAmount =
        typeof req.body?.amount === "number" && req.body.amount > 0
          ? req.body.amount
          : cart.totalAmount;
      const amount = Math.round(baseAmount * 100);

      const order = await razorpay.orders.create({
        amount,
        currency,
        receipt: `order_${req.user.id}_${Date.now()}`,
        notes: req.body?.notes || undefined,
      });

      res.status(200).json({
        success: true,
        data: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: envConfig.RAZORPAY_KEY_ID,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyRazorpayPayment(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          ErrorType.AUTHENTICATION,
          "Authentication required",
          401
        );
      }

      const { orderId, paymentId, signature } = req.body || {};
      if (!orderId || !paymentId || !signature) {
        throw new AppError(
          ErrorType.VALIDATION,
          "Missing payment verification fields",
          400
        );
      }

      if (!envConfig.RAZORPAY_KEY_SECRET) {
        throw new AppError(
          ErrorType.INTERNAL,
          "Razorpay secret is not configured",
          500
        );
      }

      const body = `${orderId}|${paymentId}`;
      const expected = crypto
        .createHmac("sha256", envConfig.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

      if (expected !== signature) {
        throw new AppError(
          ErrorType.VALIDATION,
          "Payment signature verification failed",
          400
        );
      }

      res.status(200).json({
        success: true,
        data: { verified: true },
      });
    } catch (error) {
      next(error);
    }
  }
}
