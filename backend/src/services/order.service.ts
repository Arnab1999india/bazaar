import { Order } from "../models/Order";
import { Cart } from "../models/Cart";
import { Product } from "../models/Product";
import {
  IOrderInput,
  IOrderQuery,
  OrderStatus,
} from "../interfaces/order.interface";
import { AppError, ErrorType } from "../interfaces/error.interface";

export class OrderService {
  static async createOrder(
    userId: string,
    orderData: IOrderInput
  ): Promise<any> {
    try {
      // If items are provided in orderData, use them; otherwise, use cart items
      let orderItems;

      if (orderData.items && orderData.items.length > 0) {
        // Create order from provided items
        orderItems = [];

        for (const item of orderData.items) {
          const product = await Product.findById(item.productId);
          if (!product) {
            throw new AppError(
              ErrorType.NOT_FOUND,
              `Product ${item.productId} not found`,
              404
            );
          }

          if (product.stockStatus === "out-of-stock") {
            throw new AppError(
              ErrorType.VALIDATION,
              `Product ${product.name} is out of stock`,
              400
            );
          }

          orderItems.push({
            product: product.id,
            quantity: item.quantity,
            price: product.price,
          });
        }
      } else {
        // Create order from cart
        const cart = await Cart.findByUser(userId);
        if (!cart || cart.items.length === 0) {
          throw new AppError(ErrorType.VALIDATION, "Cart is empty", 400);
        }

        // Populate cart items with product details
        await cart.populate("items.product", "name price stockStatus");

        orderItems = cart.items.map((item: any) => {
          if (item.product.stockStatus === "out-of-stock") {
            throw new AppError(
              ErrorType.VALIDATION,
              `Product ${item.product.name} is out of stock`,
              400
            );
          }

          return {
            product: item.product.id || item.product._id,
            quantity: item.quantity,
            price: item.product.price,
          };
        });
      }

      // Calculate total amount
      const totalAmount = orderItems.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );

      // Create order
      const order = await Order.create({
        items: orderItems,
        buyer: userId,
        totalAmount,
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod,
        status: OrderStatus.PENDING,
        paymentStatus: "pending",
      });

      // If order was created from cart, clear the cart
      if (!orderData.items || orderData.items.length === 0) {
        const cart = await Cart.findByUser(userId);
        if (cart) {
          await cart.clearCart();
        }
      }

      // Populate order with product and buyer details
      await order.populate([
        { path: "buyer", select: "name email" },
        { path: "items.product", select: "name price imageUrl" },
      ]);

      return order.toJSON();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error creating order", 500);
    }
  }

  static async getOrderById(orderId: string, userId: string): Promise<any> {
    try {
      const order = await Order.findById(orderId)
        .populate("buyer", "name email")
        .populate("items.product", "name price imageUrl");

      if (!order) {
        throw new AppError(ErrorType.NOT_FOUND, "Order not found", 404);
      }

      // Check if user owns this order
      if (order.buyer.toString() !== userId) {
        throw new AppError(ErrorType.AUTHORIZATION, "Access denied", 403);
      }

      return order.toJSON();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error fetching order", 500);
    }
  }

  static async getUserOrders(
    userId: string,
    query: IOrderQuery = {}
  ): Promise<{ orders: any[]; total: number; page: number; limit: number }> {
    try {
      const { status, startDate, endDate, page = 1, limit = 10 } = query;

      // Build filter
      const filter: any = { buyer: userId };

      if (status) {
        filter.status = status;
      }

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = startDate;
        if (endDate) filter.createdAt.$lte = endDate;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get orders with pagination
      const [orders, total] = await Promise.all([
        Order.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("buyer", "name email")
          .populate("items.product", "name price imageUrl"),
        Order.countDocuments(filter),
      ]);

      return {
        orders: orders.map((order) => order.toJSON()),
        total,
        page,
        limit,
      };
    } catch (error) {
      throw new AppError(ErrorType.INTERNAL, "Error fetching orders", 500);
    }
  }

  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    userId?: string
  ): Promise<any> {
    try {
      const order = await Order.findById(orderId);

      if (!order) {
        throw new AppError(ErrorType.NOT_FOUND, "Order not found", 404);
      }

      // If userId is provided, check ownership (for customer updates)
      if (userId && order.buyer.toString() !== userId) {
        throw new AppError(ErrorType.AUTHORIZATION, "Access denied", 403);
      }

      // Update order status
      await order.updateStatus(status);

      // Populate and return updated order
      await order.populate([
        { path: "buyer", select: "name email" },
        { path: "items.product", select: "name price imageUrl" },
      ]);

      return order.toJSON();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorType.INTERNAL,
        "Error updating order status",
        500
      );
    }
  }

  static async cancelOrder(orderId: string, userId: string): Promise<any> {
    try {
      const order = await Order.findById(orderId);

      if (!order) {
        throw new AppError(ErrorType.NOT_FOUND, "Order not found", 404);
      }

      // Check ownership
      if (order.buyer.toString() !== userId) {
        throw new AppError(ErrorType.AUTHORIZATION, "Access denied", 403);
      }

      // Check if order can be cancelled
      if (
        order.status === OrderStatus.DELIVERED ||
        order.status === OrderStatus.CANCELLED
      ) {
        throw new AppError(
          ErrorType.VALIDATION,
          "Order cannot be cancelled",
          400
        );
      }

      // Cancel order
      await order.updateStatus(OrderStatus.CANCELLED);

      // Populate and return updated order
      await order.populate([
        { path: "buyer", select: "name email" },
        { path: "items.product", select: "name price imageUrl" },
      ]);

      return order.toJSON();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error cancelling order", 500);
    }
  }

  static async getOrderStats(userId: string): Promise<any> {
    try {
      const stats = await Order.aggregate([
        { $match: { buyer: userId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ]);

      const totalOrders = await Order.countDocuments({ buyer: userId });
      const totalSpent = await Order.aggregate([
        { $match: { buyer: userId, status: { $ne: OrderStatus.CANCELLED } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]);

      return {
        totalOrders,
        totalSpent: totalSpent[0]?.total || 0,
        statusBreakdown: stats,
      };
    } catch (error) {
      throw new AppError(ErrorType.INTERNAL, "Error fetching order stats", 500);
    }
  }
}
