import { Product, IProductDocument } from "../models/Product";
import {
  IProduct,
  IProductInput,
  IProductQuery,
  IProductUpdateInput,
} from "../interfaces/product.interface";
import { AppError, ErrorType } from "../interfaces/error.interface";
import mongoose from "mongoose";

export class ProductService {
  private static documentToProduct(doc: IProductDocument): IProduct {
    const product = doc.toJSON();
    return {
      ...product,
      id: product._id.toString(),
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt),
    } as IProduct;
  }

  static async createProduct(
    productData: IProductInput,
    userId: string
  ): Promise<IProduct> {
    try {
      const product = await Product.create({
        ...productData,
        owner: userId,
        imageUrl: productData.imageUrl || [],
        stockStatus: productData.stockStatus || "in-stock",
      });

      return this.documentToProduct(product);
    } catch (error) {
      throw new AppError(ErrorType.INTERNAL, "Error creating product", 500);
    }
  }

  static async getProducts(
    query: IProductQuery
  ): Promise<{ products: IProduct[]; total: number }> {
    try {
      const {
        search,
        category,
        minPrice,
        maxPrice,
        stockStatus,
        sortBy = "createdAt",
        sortOrder = "desc",
        page = 1,
        limit = 10,
      } = query;

      // Build filter object
      const filter: Record<string, any> = {};

      if (search) {
        filter.$text = { $search: search };
      }

      if (category) {
        filter.category = category;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        filter.price = {};
        if (minPrice !== undefined) filter.price.$gte = minPrice;
        if (maxPrice !== undefined) filter.price.$lte = maxPrice;
      }

      if (stockStatus) {
        filter.stockStatus = stockStatus;
      }

      // Build sort object
      const sort: Record<string, any> = {};
      if (search && sortBy === "relevance") {
        sort.score = { $meta: "textScore" };
      } else {
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const [products, total] = await Promise.all([
        Product.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate("owner", "name")
          .populate("reviews"),
        Product.countDocuments(filter),
      ]);

      return {
        products: products.map((product) => this.documentToProduct(product)),
        total,
      };
    } catch (error) {
      throw new AppError(ErrorType.INTERNAL, "Error fetching products", 500);
    }
  }

  static async getProductById(productId: string): Promise<IProduct> {
    try {
      const product = await Product.findById(productId)
        .populate("owner", "name")
        .populate("reviews");

      if (!product) {
        throw new AppError(ErrorType.NOT_FOUND, "Product not found", 404);
      }

      return this.documentToProduct(product);
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof mongoose.Error.CastError) {
        throw new AppError(ErrorType.VALIDATION, "Invalid product ID", 400);
      }
      throw new AppError(ErrorType.INTERNAL, "Error fetching product", 500);
    }
  }

  static async updateProduct(
    updateData: IProductUpdateInput,
    userId: string
  ): Promise<IProduct> {
    try {
      const product = await Product.findOne({
        _id: updateData.id,
        owner: userId,
      });

      if (!product) {
        throw new AppError(
          ErrorType.NOT_FOUND,
          "Product not found or you do not have permission to update it",
          404
        );
      }

      // Remove id from update data
      const { id, ...updateFields } = updateData;

      Object.assign(product, updateFields);
      await product.save();

      return this.documentToProduct(product);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error updating product", 500);
    }
  }

  static async deleteProduct(productId: string, userId: string): Promise<void> {
    try {
      const product = await Product.findOne({
        _id: productId,
        owner: userId,
      });

      if (!product) {
        throw new AppError(
          ErrorType.NOT_FOUND,
          "Product not found or you do not have permission to delete it",
          404
        );
      }

      await product.deleteOne();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error deleting product", 500);
    }
  }

  static async updateProductRating(productId: string): Promise<number> {
    try {
      const product = await Product.findById(productId);

      if (!product) {
        throw new AppError(ErrorType.NOT_FOUND, "Product not found", 404);
      }

      const newRating = await product.calculateAverageRating();
      return newRating;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorType.INTERNAL,
        "Error updating product rating",
        500
      );
    }
  }

  static async getProductsByCategory(category: string): Promise<IProduct[]> {
    try {
      const products = await Product.findByCategory(category);
      return products.map((product) => this.documentToProduct(product));
    } catch (error) {
      throw new AppError(
        ErrorType.INTERNAL,
        "Error fetching products by category",
        500
      );
    }
  }

  static async searchProducts(query: string): Promise<IProduct[]> {
    try {
      const products = await Product.searchProducts(query);
      return products.map((product) => this.documentToProduct(product));
    } catch (error) {
      throw new AppError(ErrorType.INTERNAL, "Error searching products", 500);
    }
  }
}
