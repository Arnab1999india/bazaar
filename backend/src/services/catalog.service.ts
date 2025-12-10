import mongoose from "mongoose";
import { Category } from "../models/Category";
import { Brand } from "../models/Brand";
import { Deal } from "../models/Deal";
import { Product, IProductDocument } from "../models/Product";
import { Order } from "../models/Order";
import { ProductView } from "../models/ProductView";

export class CatalogService {
  static async getCategoryTree() {
    const [categories, productCounts] = await Promise.all([
      Category.find().lean(),
      Product.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const countMap = new Map<string, number>();
    productCounts.forEach((entry: any) => {
      if (entry._id) {
        countMap.set(entry._id, entry.count);
      }
    });

    const nodeMap = new Map<
      string,
      {
        id: string;
        name: string;
        slug: string;
        parentId?: string | null;
        count: number;
        children: any[];
      }
    >();

    const roots: any[] = [];

    categories.forEach((category) => {
      nodeMap.set(category.id, {
        id: category.id,
        name: category.name,
        slug: category.slug,
        parentId: category.parentId ?? null,
        count: countMap.get(category.slug) || 0,
        children: [],
      });
    });

    nodeMap.forEach((node) => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)?.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const aggregateCounts = (node: any): number => {
      if (!node.children.length) {
        return node.count;
      }
      const childCount = node.children.reduce(
        (total: number, child: any) => total + aggregateCounts(child),
        0
      );
      node.count += childCount;
      return node.count;
    };

    roots.forEach((root) => aggregateCounts(root));

    return roots;
  }

  static async getBrands(category?: string) {
    if (!category) {
      return Brand.find().sort({ name: 1 }).lean();
    }

    const normalized = category.toLowerCase();
    const matchedCategory =
      (await Category.findOne({ slug: normalized })) ??
      (await Category.findById(category));

    if (!matchedCategory) {
      return [];
    }

    return Brand.find({
      categoryIds: matchedCategory.id,
    })
      .sort({ name: 1 })
      .lean();
  }

  static async getDeals() {
    const deals = await Deal.findActiveDeals();
    return deals;
  }

  static async getBestsellers(category?: string, limit = 12) {
    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: { status: { $ne: "cancelled" } },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
    ];

    const results = await Order.aggregate(pipeline);
    const ids = results
      .map((entry) => {
        try {
          return new mongoose.Types.ObjectId(entry._id);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as mongoose.Types.ObjectId[];

    if (!ids.length) {
      return [];
    }

    const productFilter: mongoose.FilterQuery<IProductDocument> = {
      _id: { $in: ids },
    };

    if (category) {
      const normalized = category.toLowerCase();
      productFilter.$or = [
        { category: normalized },
        { categoryPath: normalized },
      ];
    }

    const products = await Product.find(productFilter).lean();
    const productMap = new Map(
      products.map((product) => [product._id.toString(), product])
    );

    return ids
      .map((id) => productMap.get(id.toString()))
      .filter(Boolean)
      .slice(0, limit);
  }

  static async getRecentlyViewed(userId: string, limit = 10) {
    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: { userId },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$productId",
          lastViewedAt: { $first: "$createdAt" },
        },
      },
      {
        $sort: { lastViewedAt: -1 },
      },
      {
        $limit: Math.min(limit, 20),
      },
    ];

    const views = await ProductView.aggregate(pipeline);
    const productIds = views.map((view) => view._id);
    if (!productIds.length) {
      return [];
    }

    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const map = new Map(
      products.map((product) => [product._id.toString(), product])
    );

    return productIds
      .map((id) => map.get(id.toString()))
      .filter(Boolean);
  }

  static async recordProductView(data: {
    productId: string;
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
  }) {
    await ProductView.logView(data);
  }
}
