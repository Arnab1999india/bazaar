import { Request, Response } from "express";
import { SellerService } from "../services/seller.service";
import { EmailService } from "../services/email.service";
import { User } from "../models/User";

export class SellerController {
  static async getMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res
          .status(401)
          .json({ success: false, message: "Authentication required" });
        return;
      }

      const profile = await SellerService.getProfileByUser(userId);
      if (!profile) {
        res.status(404).json({
          success: false,
          message: "Seller profile not found",
        });
        return;
      }
      res.json({ success: true, data: profile });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch seller profile" });
    }
  }

  static async onboardSeller(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res
          .status(401)
          .json({ success: false, message: "Authentication required" });
        return;
      }

      const profile = await SellerService.upsertProfile(userId, req.body);
      res.status(201).json({ success: true, data: profile });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to submit seller profile" });
    }
  }

  static async updateMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res
          .status(401)
          .json({ success: false, message: "Authentication required" });
        return;
      }

      const profile = await SellerService.updateProfile(userId, req.body);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      if (error.message === "Seller profile not found") {
        res
          .status(404)
          .json({ success: false, message: "Seller profile not found" });
        return;
      }
      res
        .status(500)
        .json({ success: false, message: "Failed to update seller profile" });
    }
  }

  static async listSellers(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as any;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const data = await SellerService.listProfiles(status, page, limit);
      res.json({ success: true, data: data.profiles, pagination: data.pagination });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch sellers" });
    }
  }

  static async approveSeller(req: Request, res: Response): Promise<void> {
    try {
      const profile = await SellerService.approveSeller(req.params.sellerId);
      // Send approval email (non-blocking)
      User.findById(req.params.sellerId).then((user) => {
        if (user?.email) {
          EmailService.sendSellerApprovalEmail(user.email, (profile as any).businessName || user.name).catch(() => {});
        }
      }).catch(() => {});
      res.json({ success: true, data: profile });
    } catch (error: any) {
      if (error.message === "Seller profile not found") {
        res
          .status(404)
          .json({ success: false, message: "Seller profile not found" });
        return;
      }
      res
        .status(500)
        .json({ success: false, message: "Failed to approve seller" });
    }
  }

  static async rejectSeller(req: Request, res: Response): Promise<void> {
    try {
      const reason = String(req.body?.reason ?? "").trim();
      const profile = await SellerService.rejectSeller(
        req.params.sellerId,
        reason
      );
      res.json({ success: true, data: profile });
    } catch (error: any) {
      if (error.message === "Seller profile not found") {
        res
          .status(404)
          .json({ success: false, message: "Seller profile not found" });
        return;
      }
      res
        .status(500)
        .json({ success: false, message: "Failed to reject seller" });
    }
  }
}
