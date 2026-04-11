import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { Cart } from "../models/Cart";
import {
  IOrderInput,
  IOrderQuery,
  OrderStatus,
  PaymentStatus,
  IReturnRequestInput,
  IShipmentUpdate,
} from "../interfaces/order.interface";
import { AppError, ErrorType } from "../interfaces/error.interface";

export class EnhancedOrderService {
  // Create order with enhanced details
  static async createOrder(userId: string, orderData: IOrderInput) {
    try {
      let orderItems;

      if (orderData.items && orderData.items.length > 0) {
        orderItems = [];

        for (const item of orderData.items) {
          const product = await Product.findById(item.productId);
          if (!product) {
            throw new AppError(
              ErrorType.NOT_FOUND,
              `Product ${item.productId} not found`,
              404,
            );
          }

          if (product.stockStatus === "out-of-stock") {
            throw new AppError(
              ErrorType.VALIDATION,
              `Product ${product.name} is out of stock`,
              400,
            );
          }

          orderItems.push({
            product: product.id,
            quantity: item.quantity,
            price: product.price,
            name: product.name,
            imageUrl: product.imageUrl?.[0],
          });
        }
      } else {
        // Create from cart
        const cart = await Cart.findByUser(userId);
        if (!cart || cart.items.length === 0) {
          throw new AppError(ErrorType.VALIDATION, "Cart is empty", 400);
        }

        await cart.populate("items.product");

        orderItems = cart.items.map((item: any) => ({
          product: item.product.id || item.product._id,
          quantity: item.quantity,
          price: item.product.price,
          name: item.product.name,
          imageUrl: item.product.imageUrl?.[0],
        }));
      }

      // Calculate pricing
      const subtotal = orderItems.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0,
      );
      const deliveryCharge = subtotal > 500 ? 0 : 40; // Free delivery over ₹500
      const tax = Math.round(subtotal * 0.18); // 18% GST
      const discount = 0;
      const totalAmount = subtotal + deliveryCharge + tax - discount;

      // Create order
      const order = await Order.create({
        items: orderItems,
        buyer: userId,
        subtotal,
        discount,
        deliveryCharge,
        tax,
        totalAmount,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress || orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod,
        customerNotes: orderData.customerNotes,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      });

      // Clear cart if order was created from cart
      if (!orderData.items || orderData.items.length === 0) {
        const cart = await Cart.findByUser(userId);
        if (cart) {
          await cart.clearCart();
        }
      }

      // Populate and return
      await order.populate([
        { path: "buyer", select: "name email phone" },
        { path: "items.product", select: "name imageUrl" },
      ]);

      return order.toJSON();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error creating order", 500);
    }
  }

  // Advanced order query with filters
  static async queryOrders(query: IOrderQuery = {}) {
    try {
      const {
        buyer,
        seller,
        status,
        paymentStatus,
        startDate,
        endDate,
        search,
        minAmount,
        maxAmount,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = query;

      const filter: any = {};

      if (buyer) filter.buyer = buyer;
      if (seller) filter.seller = seller;

      if (status) {
        filter.status = Array.isArray(status) ? { $in: status } : status;
      }

      if (paymentStatus) filter.paymentStatus = paymentStatus;

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = startDate;
        if (endDate) filter.createdAt.$lte = endDate;
      }

      if (search) {
        filter.$or = [
          { orderNumber: { $regex: search, $options: "i" } },
          { "shippingAddress.fullName": { $regex: search, $options: "i" } },
        ];
      }

      if (minAmount !== undefined || maxAmount !== undefined) {
        filter.totalAmount = {};
        if (minAmount !== undefined) filter.totalAmount.$gte = minAmount;
        if (maxAmount !== undefined) filter.totalAmount.$lte = maxAmount;
      }

      const skip = (page - 1) * limit;
      const sort: any = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate("buyer", "name email")
          .populate("items.product", "name imageUrl"),
        Order.countDocuments(filter),
      ]);

      return {
        orders: orders.map((order) => order.toJSON()),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      };
    } catch (error) {
      throw new AppError(ErrorType.INTERNAL, "Error querying orders", 500);
    }
  }

  // Update order status with validation
  static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    userId?: string,
    userRole?: string,
  ) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new AppError(ErrorType.NOT_FOUND, "Order not found", 404);
      }

      // Validate status transition
      const validTransitions: { [key: string]: OrderStatus[] } = {
        [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        [OrderStatus.CONFIRMED]: [
          OrderStatus.PROCESSING,
          OrderStatus.CANCELLED,
        ],
        [OrderStatus.PROCESSING]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
        [OrderStatus.PACKED]: [OrderStatus.SHIPPED],
        [OrderStatus.SHIPPED]: [OrderStatus.OUT_FOR_DELIVERY],
        [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
        [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
      };

      const allowedStatuses = validTransitions[order.status] || [];
      if (!allowedStatuses.includes(newStatus)) {
        throw new AppError(
          ErrorType.VALIDATION,
          `Cannot change status from ${order.status} to ${newStatus}`,
          400,
        );
      }

      await order.updateStatus(newStatus, userId);
      await order.populate([
        { path: "buyer", select: "name email" },
        { path: "items.product", select: "name imageUrl" },
      ]);

      return order.toJSON();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorType.INTERNAL,
        "Error updating order status",
        500,
      );
    }
  }

  // Add shipment tracking
  static async addShipmentTracking(
    orderId: string,
    shipmentData: IShipmentUpdate,
  ) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new AppError(ErrorType.NOT_FOUND, "Order not found", 404);
      }

      order.shipmentTracking = {
        carrier: shipmentData.carrier,
        trackingNumber: shipmentData.trackingNumber,
        trackingUrl: shipmentData.trackingUrl,
        estimatedDelivery: shipmentData.estimatedDelivery,
        updates: [
          {
            status: "Shipped",
            location: "Warehouse",
            timestamp: new Date(),
            description: "Package has been shipped",
          },
        ],
      };

      await order.save();
      return order.toJSON();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorType.INTERNAL,
        "Error adding shipment tracking",
        500,
      );
    }
  }

  // Request return
  static async requestReturn(
    orderId: string,
    userId: string,
    returnData: IReturnRequestInput,
  ) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new AppError(ErrorType.NOT_FOUND, "Order not found", 404);
      }

      if (order.buyer.toString() !== userId) {
        throw new AppError(ErrorType.AUTHORIZATION, "Access denied", 403);
      }

      if (order.status !== OrderStatus.DELIVERED) {
        throw new AppError(
          ErrorType.VALIDATION,
          "Can only return delivered orders",
          400,
        );
      }

      // Check if return window is still open (e.g., 7 days)
      const returnWindow = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
      const deliveryDate = order.deliveredAt || order.updatedAt;
      if (Date.now() - deliveryDate.getTime() > returnWindow) {
        throw new AppError(
          ErrorType.VALIDATION,
          "Return window has expired",
          400,
        );
      }

      order.returnRequest = {
        reason: returnData.reason,
        description: returnData.description,
        images: returnData.images,
        requestedAt: new Date(),
        status: "pending",
      };

      await order.addTimelineEntry(
        "return_requested",
        "Customer requested return",
        userId,
      );

      await order.save();
      return order.toJSON();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error requesting return", 500);
    }
  }

  // Process return (admin/seller)
  static async processReturn(
    orderId: string,
    action: "approve" | "reject",
    adminUserId: string,
    notes?: string,
  ) {
    try {
      const order = await Order.findById(orderId);
      if (!order || !order.returnRequest) {
        throw new AppError(
          ErrorType.NOT_FOUND,
          "Return request not found",
          404,
        );
      }

      if (action === "approve") {
        order.returnRequest.status = "approved";
        order.returnRequest.approvedAt = new Date();
        order.returnRequest.adminNotes = notes;
        order.status = OrderStatus.RETURNED;

        await order.addTimelineEntry(
          "return_approved",
          "Return request approved",
          adminUserId,
        );
      } else {
        order.returnRequest.status = "rejected";
        order.returnRequest.rejectedAt = new Date();
        order.returnRequest.adminNotes = notes;

        await order.addTimelineEntry(
          "return_rejected",
          "Return request rejected",
          adminUserId,
        );
      }

      await order.save();
      return order.toJSON();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error processing return", 500);
    }
  }

  // Export orders to CSV
  static async exportOrdersToCSV(query: IOrderQuery = {}) {
    try {
      const { orders } = await this.queryOrders({ ...query, limit: 10000 });

      const csvRows = [
        [
          "Order Number",
          "Date",
          "Customer",
          "Email",
          "Total Amount",
          "Status",
          "Payment Status",
        ].join(","),
      ];

      orders.forEach((order: any) => {
        csvRows.push(
          [
            order.orderNumber,
            new Date(order.createdAt).toLocaleDateString(),
            order.buyer?.name || "",
            order.buyer?.email || "",
            order.totalAmount,
            order.status,
            order.paymentStatus,
          ].join(","),
        );
      });

      return csvRows.join("\n");
    } catch (error) {
      throw new AppError(ErrorType.INTERNAL, "Error exporting orders", 500);
    }
  }
}
