import { Request, Response } from "express";
import { ProductService } from "../services/product.service";

export class ProductController {
  /**
   * Get all products with pagination and filtering
   * @route GET /api/products
   */
  async getProducts(req: Request, res: Response) {
    try {
      const products = await ProductService.getProducts(req.query);
      res.json({
        success: true,
        data: products.products,
        pagination: {
          page: Number(req.query.page) || 1,
          limit: Number(req.query.limit) || 10,
          total: products.total,
        },
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch products" });
    }
  }

  /**
   * Get product by ID
   * @route GET /api/products/:id
   */
  async getProductById(req: Request, res: Response) {
    try {
      const product = await ProductService.getProductById(req.params.id);
      res.json({ success: true, data: product });
    } catch (error: any) {
      if (error.message === "Product not found") {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch product" });
    }
  }

  async getProductVariants(req: Request, res: Response) {
    try {
      const variants = await ProductService.getProductVariants(req.params.id);
      res.json({ success: true, data: variants });
    } catch (error: any) {
      if (error.message === "Product not found") {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch variants" });
    }
  }

  async getRecommendations(req: Request, res: Response) {
    try {
      const limit = Number(req.query.limit) || 8;
      const products = await ProductService.getRecommendations(
        req.params.id,
        limit
      );
      res.json({ success: true, data: products });
    } catch (error: any) {
      if (error.message === "Product not found") {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
      res.status(500).json({
        success: false,
        message: "Failed to fetch recommendations",
      });
    }
  }

  /**
   * Create a new product
   * @route POST /api/products
   */
  async createProduct(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const product = await ProductService.createProduct(req.body, userId);
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to create product" });
    }
  }

  /**
   * Update product by ID
   * @route PUT /api/products/:id
   */
  async updateProduct(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const product = await ProductService.updateProduct(
        req.params.id,
        req.body,
        userId
      );
      res.json({ success: true, data: product });
    } catch (error: any) {
      if (error.message === "Product not found") {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
      res
        .status(500)
        .json({ success: false, message: "Failed to update product" });
    }
  }

  /**
   * Delete product by ID
   * @route DELETE /api/products/:id
   */
  async deleteProduct(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const deleted = await ProductService.deleteProduct(req.params.id, userId);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
      res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to delete product" });
    }
  }
}
