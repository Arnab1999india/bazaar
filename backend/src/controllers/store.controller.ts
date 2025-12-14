import { Request, Response } from "express";
import { StoreService } from "../services/store.service";

export class StoreController {
  async getStore(req: Request, res: Response) {
    try {
      const data = await StoreService.getStoreOverview(req.params.sellerId);
      res.json({ success: true, data });
    } catch (error: any) {
      res
        .status(404)
        .json({ success: false, message: error.message || "Store not found" });
    }
  }

  async getStoreProducts(req: Request, res: Response) {
    try {
      const data = await StoreService.getStoreProducts(req.params.sellerId, {
        sort: req.query.sort as any,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 12,
      });
      res.json({ success: true, data: data.products, pagination: data.pagination });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch store products" });
    }
  }
}
