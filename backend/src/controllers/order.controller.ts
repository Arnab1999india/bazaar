import { Request, Response, NextFunction } from "express";
import { OrderService } from "../services/order.service";
import {
  IOrderInput,
  IOrderQuery,
  OrderStatus,
} from "../interfaces/order.interface";
import { AppError, ErrorType } from "../interfaces/error.interface";
import { AuthRequest } from "../middlewares/auth.middleware";

export class OrderController {
  static async createOrder(
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

      const orderData: IOrderInput = req.body;
      const order = await OrderService.createOrder(req.user.id, orderData);

      res.status(201).json({
        success: true,
        data: order,
        message: "Order created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(
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

      const { orderId } = req.params;
      const order = await OrderService.getOrderById(orderId, req.user.id);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserOrders(
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

      const query: IOrderQuery = {
        status: req.query.status as OrderStatus,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      };

      const result = await OrderService.getUserOrders(req.user.id, query);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(
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

      const { orderId } = req.params;
      const { status } = req.body;

      if (!Object.values(OrderStatus).includes(status)) {
        throw new AppError(ErrorType.VALIDATION, "Invalid order status", 400);
      }

      const order = await OrderService.updateOrderStatus(
        orderId,
        status,
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: order,
        message: "Order status updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancelOrder(
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

      const { orderId } = req.params;
      const order = await OrderService.cancelOrder(orderId, req.user.id);

      res.status(200).json({
        success: true,
        data: order,
        message: "Order cancelled successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrderStats(
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

      const stats = await OrderService.getOrderStats(req.user.id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin methods (if needed)
  static async getAllOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const query: IOrderQuery = {
        status: req.query.status as OrderStatus,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      };

      // This would need admin authentication middleware
      const result = await OrderService.getUserOrders("", query); // Empty userId for admin

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async adminUpdateOrderStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      if (!Object.values(OrderStatus).includes(status)) {
        throw new AppError(ErrorType.VALIDATION, "Invalid order status", 400);
      }

      // This would need admin authentication middleware
      const order = await OrderService.updateOrderStatus(orderId, status);

      res.status(200).json({
        success: true,
        data: order,
        message: "Order status updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
