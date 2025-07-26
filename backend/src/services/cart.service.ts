import { Cart } from "../models/Cart";
import { Product } from "../models/Product";
import { ICartItemInput, ICartResponse } from "../interfaces/cart.interface";
import { AppError, ErrorType } from "../interfaces/error.interface";

export class CartService {
  static async getCart(userId: string): Promise<ICartResponse> {
    try {
      let cart = await Cart.findByUser(userId);

      if (!cart) {
        // Create empty cart if doesn't exist
        cart = await Cart.create({
          user: userId,
          items: [],
        });
      }

      // Calculate totals
      const totalItems = cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const totalAmount = await cart.calculateTotalAmount();

      return {
        id: cart.id,
        items: cart.items.map((item: any) => ({
          product: {
            id: item.product.id || item.product._id,
            name: item.product.name,
            price: item.product.price,
            imageUrl: item.product.imageUrl,
          },
          quantity: item.quantity,
        })),
        totalItems,
        totalAmount,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error fetching cart", 500);
    }
  }

  static async addToCart(
    userId: string,
    itemData: ICartItemInput
  ): Promise<ICartResponse> {
    try {
      // Verify product exists
      const product = await Product.findById(itemData.productId);
      if (!product) {
        throw new AppError(ErrorType.NOT_FOUND, "Product not found", 404);
      }

      // Check stock status
      if (product.stockStatus === "out-of-stock") {
        throw new AppError(
          ErrorType.VALIDATION,
          "Product is out of stock",
          400
        );
      }

      // Find or create cart
      let cart = await Cart.findByUser(userId);
      if (!cart) {
        cart = await Cart.create({
          user: userId,
          items: [],
        });
      }

      // Add item to cart
      await cart.addItem(itemData.productId, itemData.quantity);

      // Return updated cart
      return await this.getCart(userId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error adding item to cart", 500);
    }
  }

  static async updateCartItem(
    userId: string,
    productId: string,
    quantity: number
  ): Promise<ICartResponse> {
    try {
      const cart = await Cart.findByUser(userId);
      if (!cart) {
        throw new AppError(ErrorType.NOT_FOUND, "Cart not found", 404);
      }

      // Update item quantity
      await cart.updateItemQuantity(productId, quantity);

      // Return updated cart
      return await this.getCart(userId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error updating cart item", 500);
    }
  }

  static async removeFromCart(
    userId: string,
    productId: string
  ): Promise<ICartResponse> {
    try {
      const cart = await Cart.findByUser(userId);
      if (!cart) {
        throw new AppError(ErrorType.NOT_FOUND, "Cart not found", 404);
      }

      // Remove item from cart
      await cart.removeItem(productId);

      // Return updated cart
      return await this.getCart(userId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorType.INTERNAL,
        "Error removing item from cart",
        500
      );
    }
  }

  static async clearCart(userId: string): Promise<{ message: string }> {
    try {
      const cart = await Cart.findByUser(userId);
      if (!cart) {
        throw new AppError(ErrorType.NOT_FOUND, "Cart not found", 404);
      }

      // Clear all items from cart
      await cart.clearCart();

      return {
        message: "Cart cleared successfully",
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error clearing cart", 500);
    }
  }

  static async getCartItemCount(userId: string): Promise<{ count: number }> {
    try {
      const cart = await Cart.findByUser(userId);
      if (!cart) {
        return { count: 0 };
      }

      const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      return { count };
    } catch (error) {
      throw new AppError(ErrorType.INTERNAL, "Error getting cart count", 500);
    }
  }
}
