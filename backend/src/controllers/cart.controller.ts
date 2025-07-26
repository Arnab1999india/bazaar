import { Request, Response, NextFunction } from "express";
import { CartService } from "../services/cart.service";
import { ICartItemInput } from "../interfaces/cart.interface";
import { AppError, ErrorType } from "../interfaces/error.interface";
import { AuthRequest } from "../middlewares/auth.middleware";

export class CartController {
  static async getCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(
          ErrorType.AUTHENTICATION,
          "Authentication required",
          401
        );
      }

      const cart = await CartService.getCart(req.user.id);

      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addToCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(
          ErrorType.AUTHENTICATION,
          "Authentication required",
          401
        );
      }

      const itemData: ICartItemInput = req.body;
      const cart = await CartService.addToCart(req.user.id, itemData);

      res.status(200).json({
        success: true,
        data: cart,
        message: "Item added to cart successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCartItem(
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

      const { productId } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity < 0) {
        throw new AppError(
          ErrorType.VALIDATION,
          "Valid quantity is required",
          400
        );
      }

      const cart = await CartService.updateCartItem(
        req.user.id,
        productId,
        quantity
      );

      res.status(200).json({
        success: true,
        data: cart,
        message: "Cart item updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeFromCart(
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

      const { productId } = req.params;
      const cart = await CartService.removeFromCart(req.user.id, productId);

      res.status(200).json({
        success: true,
        data: cart,
        message: "Item removed from cart successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async clearCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(
          ErrorType.AUTHENTICATION,
          "Authentication required",
          401
        );
      }

      const result = await CartService.clearCart(req.user.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCartItemCount(
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

      const result = await CartService.getCartItemCount(req.user.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
