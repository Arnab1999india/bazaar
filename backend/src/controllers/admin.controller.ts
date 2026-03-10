import { Request, Response } from "express";
import { User } from "../models/User";
import { Order } from "../models/Order";
import { SellerProfile } from "../models/SellerProfile";
import { UserRole } from "../interfaces/user.interface";
import { AppError, ErrorType } from "../interfaces/error.interface";

export class AdminController {
  /**
   * Create a new admin account. Only existing admins can do this.
   */
  static async createAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body;

      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        res.status(409).json({ success: false, message: "Email already registered" });
        return;
      }

      const admin = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role: UserRole.ADMIN,
        isVerified: true,
      });

      res.status(201).json({
        success: true,
        message: "Admin account created successfully",
        data: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "Failed to create admin account" });
    }
  }

  /**
   * List all admin accounts.
   */
  static async listAdmins(req: Request, res: Response): Promise<void> {
    try {
      const admins = await User.find({ role: UserRole.ADMIN }).select("-password").lean();
      res.json({ success: true, data: admins });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch admin list" });
    }
  }

  /**
   * Get platform-wide stats for admin dashboard.
   */
  static async getPlatformStats(req: Request, res: Response): Promise<void> {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const [
        totalUsers,
        totalSellers,
        pendingSellers,
        approvedSellers,
        totalOrdersAll,
        weeklyOrders,
        monthlyOrders,
        revenueStats,
        weeklyRevenue,
        monthlyRevenue,
        ordersByStatus,
      ] = await Promise.all([
        User.countDocuments({ role: { $ne: UserRole.ADMIN } }),
        User.countDocuments({ role: UserRole.SELLER }),
        SellerProfile.countDocuments({ status: "pending" }),
        SellerProfile.countDocuments({ status: "approved" }),
        Order.countDocuments({}),
        Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
        Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
        Order.aggregate([
          { $group: { _id: null, total: { $sum: "$totalAmount" }, avg: { $avg: "$totalAmount" } } },
        ]),
        Order.aggregate([
          { $match: { createdAt: { $gte: startOfWeek } } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
        Order.aggregate([
          { $match: { createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
        Order.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
      ]);

      // Build order status map
      const statusMap: Record<string, number> = {};
      for (const s of ordersByStatus) {
        statusMap[s._id] = s.count;
      }

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            sellers: totalSellers,
            buyers: totalUsers - totalSellers,
          },
          sellers: {
            pending: pendingSellers,
            approved: approvedSellers,
          },
          orders: {
            total: totalOrdersAll,
            weekly: weeklyOrders,
            monthly: monthlyOrders,
            byStatus: {
              pending: statusMap["PENDING"] || 0,
              confirmed: statusMap["CONFIRMED"] || 0,
              processing: statusMap["PROCESSING"] || 0,
              shipped: statusMap["SHIPPED"] || 0,
              delivered: statusMap["DELIVERED"] || 0,
              cancelled: statusMap["CANCELLED"] || 0,
              returned: statusMap["RETURNED"] || 0,
              refunded: statusMap["REFUNDED"] || 0,
            },
          },
          revenue: {
            total: revenueStats[0]?.total || 0,
            weekly: weeklyRevenue[0]?.total || 0,
            monthly: monthlyRevenue[0]?.total || 0,
            avgOrderValue: revenueStats[0]?.avg || 0,
          },
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch platform stats" });
    }
  }

  /**
   * List all users (buyers + sellers, not admins) for admin management.
   */
  static async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const role = req.query.role as string | undefined;
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 20, 100);

      const filter: any = { role: { $ne: UserRole.ADMIN } };
      if (role && role !== "all") {
        filter.role = role;
      }

      const [users, total] = await Promise.all([
        User.find(filter)
          .select("-password")
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        User.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: users,
        pagination: { page, limit, total },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
  }

  /**
   * List all orders for admin.
   */
  static async listOrders(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const status = req.query.status as string | undefined;

      const filter: any = {};
      if (status && status !== "all") {
        filter.status = status.toUpperCase();
      }

      const [orders, total] = await Promise.all([
        Order.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("buyer", "name email")
          .lean(),
        Order.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: orders,
        pagination: { page, limit, total },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
  }
}
