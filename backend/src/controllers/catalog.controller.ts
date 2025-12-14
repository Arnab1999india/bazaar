import { Request, Response } from "express";
import { CatalogService } from "../services/catalog.service";

export class CatalogController {
  async getCategories(_req: Request, res: Response) {
    const categories = await CatalogService.getCategoryTree();
    res.json({ success: true, data: categories });
  }

  async getBrands(req: Request, res: Response) {
    const brands = await CatalogService.getBrands(
      req.query.category?.toString()
    );
    res.json({ success: true, data: brands });
  }

  async getDeals(_req: Request, res: Response) {
    const deals = await CatalogService.getDeals();
    res.json({ success: true, data: deals });
  }

  async getBestsellers(req: Request, res: Response) {
    const category = req.query.category?.toString();
    const limit = Number(req.query.limit) || 12;
    const products = await CatalogService.getBestsellers(category, limit);
    res.json({ success: true, data: products });
  }

  async getRecentlyViewed(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    const limit = Number(req.query.limit) || 10;
    const products = await CatalogService.getRecentlyViewed(userId, limit);
    res.json({ success: true, data: products });
  }

  async trackView(req: Request, res: Response) {
    const { productId, sessionId } = req.body || {};
    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "productId is required" });
    }

    const userId = (req as any).user?.id;
    await CatalogService.recordProductView({
      productId,
      sessionId,
      userId,
      ipAddress: req.ip,
    });

    res.status(202).json({ success: true, message: "Event recorded" });
  }
}
