import mongoose from "mongoose";
import { User, IUserDocument } from "../models/User";
import { UserRole } from "../interfaces/user.interface";
import { Product } from "../models/Product";
import { Review } from "../models/Review";
import { Order } from "../models/Order";

type SortOption = "newest" | "price" | "rating";

export class StoreService {
  static async getStoreOverview(
    sellerId: string
  ): Promise<{
    seller: Pick<IUserDocument, "id" | "name" | "email" | "createdAt">;
    stats: {
      productCount: number;
      averageRating: number;
      totalReviews: number;
      totalSales: number;
      totalRevenue: number;
    };
  }> {
    const seller = await User.findById(sellerId).lean();
    if (!seller || seller.role !== UserRole.SELLER) {
      throw new Error("Seller not found");
    }

    const products = await Product.find({ owner: sellerId })
      .select("_id price rating createdAt")
      .lean();

    const productIds = products.map((product) => product._id);

    const [reviewStats] = productIds.length
      ? await Review.aggregate([
          {
            $match: {
              product: { $in: productIds.map((id) => id.toString()) },
            },
          },
          {
            $group: {
              _id: null,
              averageRating: { $avg: "$rating" },
              totalReviews: { $sum: 1 },
            },
          },
        ])
      : [];

    const [salesStats] = productIds.length
      ? await Order.aggregate([
          { $unwind: "$items" },
          {
            $lookup: {
              from: "products",
              let: { productId: "$items.product" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: [
                            "$owner",
                            sellerId,
                          ],
                        },
                        {
                          $eq: [
                            "$_id",
                            {
                              $cond: [
                                { $eq: [{ $type: "$$productId" }, "objectId"] },
                                "$$productId",
                                {
                                  $convert: {
                                    input: "$$productId",
                                    to: "objectId",
                                    onError: null,
                                    onNull: null,
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "sellerProduct",
            },
          },
          { $unwind: "$sellerProduct" },
          {
            $group: {
              _id: null,
              totalQuantity: { $sum: "$items.quantity" },
              totalRevenue: {
                $sum: {
                  $multiply: ["$items.price", "$items.quantity"],
                },
              },
            },
          },
        ])
      : [];

    return {
      seller: {
        id: seller._id.toString(),
        name: seller.name,
        email: seller.email,
        createdAt: seller.createdAt,
      },
      stats: {
        productCount: products.length,
        averageRating: reviewStats?.averageRating
          ? Math.round(reviewStats.averageRating * 10) / 10
          : 0,
        totalReviews: reviewStats?.totalReviews || 0,
        totalSales: salesStats?.totalQuantity || 0,
        totalRevenue: salesStats?.totalRevenue || 0,
      },
    };
  }

  static async getStoreProducts(
    sellerId: string,
    query: { sort?: SortOption; page?: number; limit?: number }
  ) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Number(query.limit) || 12, 48);
    const skip = (page - 1) * limit;

    const sortOption: Record<string, 1 | -1> = {};
    switch (query.sort) {
      case "price":
        sortOption.price = 1;
        break;
      case "rating":
        sortOption.rating = -1;
        break;
      default:
        sortOption.createdAt = -1;
    }

    const [products, total] = await Promise.all([
      Product.find({ owner: sellerId })
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments({ owner: sellerId }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
      },
    };
  }
}
