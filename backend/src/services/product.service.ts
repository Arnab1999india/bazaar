import mongoose, { FilterQuery } from "mongoose";
import {
  IProductDocument,
  Product,
} from "../models/Product";
import { IProductInput, IProductQuery, ProductAttribute } from "../interfaces/product.interface";
import { Order } from "../models/Order";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;

export class ProductService {
  private static buildFilter(query: IProductQuery): FilterQuery<IProductDocument> {
    const filter: FilterQuery<IProductDocument> = {};
    const andConditions: FilterQuery<IProductDocument>[] = [];

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    if (query.category) {
      const category = query.category.toLowerCase();
      andConditions.push({
        $or: [{ category }, { categoryPath: category }],
      });
    }

    if (query.brand) {
      andConditions.push({
        $or: [{ brand: query.brand }, { brand: query.brand.toLowerCase() }],
      });
    }

    const attributeFilters = ProductService.extractAttributeFilters(query);
    attributeFilters.forEach((attr) => {
      andConditions.push({
        attributes: {
          $elemMatch: {
            name: attr.name,
            value: attr.value,
          },
        },
      });
    });

    if (typeof query.minPrice === "number" || typeof query.maxPrice === "number") {
      const priceFilter: Record<string, number> = {};
      if (typeof query.minPrice === "number") priceFilter.$gte = query.minPrice;
      if (typeof query.maxPrice === "number") priceFilter.$lte = query.maxPrice;
      filter.price = priceFilter;
    }

    if (query.ratingGte) {
      filter.rating = { $gte: Number(query.ratingGte) };
    }

    if (query.inStock) {
      const inStock = typeof query.inStock === "boolean" ? query.inStock : query.inStock === "true";
      if (inStock) {
        andConditions.push({
          $or: [
            { stockStatus: "in-stock" },
            { totalStock: { $gt: 0 } },
            { "variants.stock": { $gt: 0 } },
          ],
        });
      }
    }

    if (query.stockStatus) {
      filter.stockStatus = query.stockStatus;
    }

    if (andConditions.length) {
      filter.$and = andConditions;
    }

    return filter;
  }

  private static extractAttributeFilters(query: IProductQuery): ProductAttribute[] {
    const attributes: ProductAttribute[] = [];
    Object.entries(query).forEach(([key, value]) => {
      const match = key.match(/^attributes\[(.+)\]$/);
      if (match) {
        const attributeName = match[1].toLowerCase();
        const rawValues = Array.isArray(value) ? value : String(value).split(",");
        rawValues
          .map((val) => val.trim().toLowerCase())
          .filter(Boolean)
          .forEach((val) => attributes.push({ name: attributeName, value: val }));
      }
    });
    return attributes;
  }

  static async createProduct(productData: IProductInput, userId: string) {
    const normalized = {
      ...productData,
      owner: userId,
      imageUrl: productData.imageUrl || [],
      stockStatus: productData.stockStatus || "in-stock",
      brand: productData.brand?.toLowerCase(),
      category: productData.category.toLowerCase(),
      categoryPath: productData.categoryPath?.map((c) => c.toLowerCase()) ?? [productData.category.toLowerCase()],
      tags: productData.tags?.map((tag) => tag.toLowerCase()),
      attributes: productData.attributes?.map((attr) => ({
        name: attr.name.toLowerCase(),
        value: attr.value.toLowerCase(),
      })),
      variants: productData.variants,
      locations: productData.locations,
    };

    const product = await Product.create(normalized);
    return product;
  }

  static async getProducts(rawQuery: any) {
    const page = Math.max(Number(rawQuery.page) || DEFAULT_PAGE, 1);
    const limit = Math.min(Number(rawQuery.limit) || DEFAULT_LIMIT, 48);
    const skip = (page - 1) * limit;

    const query: IProductQuery = {
      search: rawQuery.q || rawQuery.search,
      category: rawQuery.category,
      brand: rawQuery.brand,
      minPrice: rawQuery.minPrice ? Number(rawQuery.minPrice) : undefined,
      maxPrice: rawQuery.maxPrice ? Number(rawQuery.maxPrice) : undefined,
      ratingGte: rawQuery.ratingGte ? Number(rawQuery.ratingGte) : undefined,
      inStock: rawQuery.inStock,
      stockStatus: rawQuery.inStock ? undefined : rawQuery.stockStatus,
      sortBy: rawQuery.sort,
      sortOrder: rawQuery.sortOrder,
      limit,
      page,
    };

    const filter = this.buildFilter(query);
    const sortOption = this.getSortOption(query);
    const useTextScore = Boolean(filter.$text);

    if (query.sortBy === "bestseller") {
      return this.getBestsellerProducts(filter, { page, limit });
    }

    const findQuery = Product.find(filter);

    if (useTextScore) {
      findQuery.select({ score: { $meta: "textScore" } });
      if (query.sortBy === "relevance" || !query.sortBy) {
        findQuery.sort({ score: { $meta: "textScore" } });
      } else if (sortOption) {
        findQuery.sort(sortOption);
      }
    } else if (sortOption) {
      findQuery.sort(sortOption);
    } else {
      findQuery.sort({ createdAt: -1 });
    }

    const [products, total] = await Promise.all([
      findQuery.skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      total,
    };
  }

  private static getSortOption(
    query: IProductQuery
  ): Record<string, 1 | -1> | null {
    if (!query.sortBy) {
      return null;
    }
    const order: 1 | -1 = query.sortOrder === "asc" ? 1 : -1;
    switch (query.sortBy) {
      case "price":
        return { price: order };
      case "rating":
        return { rating: order };
      case "createdAt":
        return { createdAt: order };
      case "relevance":
        return null;
      default:
        return null;
    }
  }

  private static async getBestsellerProducts(
    filter: FilterQuery<IProductDocument>,
    options: { page: number; limit: number }
  ) {
    const matchStage: mongoose.PipelineStage.Match = { $match: { status: { $ne: "cancelled" } } };
    const pipeline: mongoose.PipelineStage[] = [
      matchStage,
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          let: { productId: "$items.product" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    "$_id",
                    {
                      $cond: {
                        if: { $eq: [{ $type: "$$productId" }, "objectId"] },
                        then: "$$productId",
                        else: {
                          $convert: {
                            input: "$$productId",
                            to: "objectId",
                            onError: null,
                            onNull: null,
                          },
                        },
                      },
                    }
                  ],
                },
              },
            },
          ],
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $match: {
          ...this.mapFilterToProductMatch(filter, "product"),
        },
      },
      {
        $group: {
          _id: "$product._id",
          totalSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      {
        $facet: {
          ids: [
            { $skip: (options.page - 1) * options.limit },
            { $limit: options.limit },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const results = await Order.aggregate(pipeline);
    const idsFacet = results[0] || { ids: [], totalCount: [] };
    const ids = idsFacet.ids.map((doc: any) => doc._id);
    const total = idsFacet.totalCount[0]?.count || 0;

    if (!ids.length) {
      return { products: [], total };
    }

    const products = await Product.find({ _id: { $in: ids } }).lean();
    const productMap = new Map(
      products.map((product) => [product._id.toString(), product])
    );
    const orderedProducts = ids
      .map((id: mongoose.Types.ObjectId) => productMap.get(id.toString()))
      .filter(Boolean);

    return {
      products: orderedProducts,
      total,
    };
  }

  private static mapFilterToProductMatch(
    filter: FilterQuery<IProductDocument>,
    prefix: string
  ): FilterQuery<IProductDocument> {
    const mapped: FilterQuery<IProductDocument> = {};
    const rewriteKey = (key: string) => `${prefix}.${key}`;

    Object.entries(filter).forEach(([key, value]) => {
      if (["$and", "$or"].includes(key) && Array.isArray(value)) {
        (mapped as any)[key] = value.map((condition) =>
          this.mapFilterToProductMatch(condition as any, prefix)
        );
      } else if (key === "$text") {
        // Text search is not supported inside lookup match; ignore for bestseller context
      } else {
        (mapped as any)[rewriteKey(key)] = value;
      }
    });

    return mapped;
  }

  static async getProductById(productId: string) {
    const product = await Product.findById(productId)
      .populate("brand", "name slug logoUrl")
      .populate("owner", "name email role")
      .lean();
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  }

  static async getProductVariants(productId: string) {
    const product = await Product.findById(productId)
      .select("variants attributes name brand")
      .lean();
    if (!product) {
      throw new Error("Product not found");
    }
    return product.variants || [];
  }

  static async getRecommendations(productId: string, limit = 8) {
    const product = await Product.findById(productId).lean();
    if (!product) {
      throw new Error("Product not found");
    }

    const rawConditions: (FilterQuery<IProductDocument> | null)[] = [
      { category: product.category },
      product.brand ? { brand: product.brand } : null,
      product.tags && product.tags.length
        ? { tags: { $in: product.tags } }
        : null,
    ];
    const orConditions = rawConditions.filter(
      (condition): condition is FilterQuery<IProductDocument> => condition !== null
    );

    const recommendationFilter: FilterQuery<IProductDocument> = {
      _id: { $ne: product._id },
    };

    if (orConditions.length) {
      recommendationFilter.$or = orConditions as any;
    }

    const recommendations = await Product.find(recommendationFilter)
      .sort({ rating: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return recommendations;
  }

  static async updateProduct(
    productId: string,
    updateData: Partial<IProductInput>,
    userId: string
  ) {
    const normalizedUpdate: Record<string, unknown> = {
      ...updateData,
    };

    if (updateData.category) {
      normalizedUpdate.category = updateData.category.toLowerCase();
    }
    if (updateData.categoryPath) {
      normalizedUpdate.categoryPath = updateData.categoryPath.map((c) =>
        c.toLowerCase()
      );
    }
    if (updateData.brand) {
      normalizedUpdate.brand = updateData.brand.toLowerCase();
    }
    if (updateData.tags) {
      normalizedUpdate.tags = updateData.tags.map((tag) => tag.toLowerCase());
    }
    if (updateData.attributes) {
      normalizedUpdate.attributes = updateData.attributes.map((attr) => ({
        name: attr.name.toLowerCase(),
        value: attr.value.toLowerCase(),
      }));
    }

    const product = await Product.findOneAndUpdate(
      { _id: productId, owner: userId },
      normalizedUpdate,
      { new: true }
    );
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  }

  static async deleteProduct(productId: string, userId: string) {
    const result = await Product.deleteOne({ _id: productId, owner: userId });
    return result.deletedCount > 0;
  }
}
