import { Router } from "express";
import { auth, authorize } from "../middlewares/auth.middleware";
import { UserRole } from "../interfaces/user.interface";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { SellerProfile } from "../models/SellerProfile";

const router = Router();

router.use(auth, authorize(UserRole.SELLER));

/**
 * GET /api/seller/stats
 * Returns comprehensive seller dashboard statistics.
 */
router.get("/stats", async (req: any, res) => {
  try {
    const sellerId = req.user?.id;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalOrders,
      weeklyOrders,
      monthlyOrders,
      lastMonthOrders,
      ordersByStatus,
      weeklySalesAgg,
      monthlySalesAgg,
      lastMonthSalesAgg,
      totalSalesAgg,
      productCount,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments({ seller: sellerId }),
      Order.countDocuments({ seller: sellerId, createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ seller: sellerId, createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ seller: sellerId, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Order.aggregate([
        { $match: { seller: sellerId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { seller: sellerId, createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
      ]),
      Order.aggregate([
        { $match: { seller: sellerId, createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
      ]),
      Order.aggregate([
        { $match: { seller: sellerId, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
      ]),
      Order.aggregate([
        { $match: { seller: sellerId } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" }, avg: { $avg: "$totalAmount" } } },
      ]),
      Product.countDocuments({ seller: sellerId }),
      Order.find({ seller: sellerId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("orderNumber status totalAmount createdAt buyer")
        .populate("buyer", "name email")
        .lean(),
    ]);

    const statusMap: Record<string, number> = {};
    for (const s of ordersByStatus) {
      statusMap[s._id] = s.count;
    }

    const weeklySales = weeklySalesAgg[0]?.revenue || 0;
    const monthlySales = monthlySalesAgg[0]?.revenue || 0;
    const lastMonthSales = lastMonthSalesAgg[0]?.revenue || 0;
    const growthRate = lastMonthSales > 0
      ? (((monthlySales - lastMonthSales) / lastMonthSales) * 100).toFixed(1)
      : null;

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          totalRevenue: totalSalesAgg[0]?.revenue || 0,
          avgOrderValue: totalSalesAgg[0]?.avg || 0,
          totalProducts: productCount,
        },
        weekly: {
          orders: weeklyOrders,
          revenue: weeklySales,
        },
        monthly: {
          orders: monthlyOrders,
          revenue: monthlySales,
          lastMonthRevenue: lastMonthSales,
          growthRate,
        },
        ordersByStatus: {
          pending: statusMap["PENDING"] || 0,
          confirmed: statusMap["CONFIRMED"] || 0,
          processing: statusMap["PROCESSING"] || 0,
          packed: statusMap["PACKED"] || 0,
          shipped: statusMap["SHIPPED"] || 0,
          outForDelivery: statusMap["OUT_FOR_DELIVERY"] || 0,
          delivered: statusMap["DELIVERED"] || 0,
          cancelled: statusMap["CANCELLED"] || 0,
          returned: statusMap["RETURNED"] || 0,
          refunded: statusMap["REFUNDED"] || 0,
        },
        recentOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch seller stats" });
  }
});

export default router;
