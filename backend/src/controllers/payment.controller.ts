import { Request, Response, NextFunction } from "express";
import { PaymentService } from "../services/payment.service";
import { AppError, ErrorType } from "../interfaces/error.interface";
import { AuthRequest } from "../middlewares/auth.middleware";

export class PaymentController {
  static async createPaymentOrder(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          ErrorType.AUTHENTICATION,
          "Authentication required",
          401,
        );
      }

      const { orderId, amount, currency } = req.body;
      const result = await PaymentService.createPaymentOrder(req.user.id, {
        orderId,
        amount,
        currency,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyPayment(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          ErrorType.AUTHENTICATION,
          "Authentication required",
          401,
        );
      }

      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } =
        req.body;

      const result = await PaymentService.verifyPayment({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPaymentByOrderId(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          ErrorType.AUTHENTICATION,
          "Authentication required",
          401,
        );
      }

      const { orderId } = req.params;
      const payment = await PaymentService.getPaymentByOrderId(
        orderId,
        req.user.id,
      );

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }
}
