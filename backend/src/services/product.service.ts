import { Product } from "../models/Product";

export class ProductService {
  static async createProduct(productData: any, userId: string) {
    const product = await Product.create({
      ...productData,
      owner: userId,
      imageUrl: productData.imageUrl || [],
      stockStatus: productData.stockStatus || "in-stock",
    });
    return product;
  }

  static async getProducts(query: any) {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      minPrice,
      maxPrice,
    } = query;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("owner", "name"),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      total,
    };
  }

  static async getProductById(productId: string) {
    const product = await Product.findById(productId).populate("owner", "name");
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  }

  static async updateProduct(
    productId: string,
    updateData: any,
    userId: string
  ) {
    const product = await Product.findOneAndUpdate(
      { _id: productId, owner: userId },
      updateData,
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
