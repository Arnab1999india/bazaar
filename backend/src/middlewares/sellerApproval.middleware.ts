import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { UserRole } from "../interfaces/user.interface";
import { SellerProfile } from "../models/SellerProfile";

export const requireApprovedSeller = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  if (user.role === UserRole.ADMIN) {
    return next();
  }

  if (user.role !== UserRole.SELLER) {
    return res
      .status(403)
      .json({ success: false, message: "Seller role required" });
  }

  try {
    const profile = await SellerProfile.findOne({ user: user.id }).lean();
    if (!profile || profile.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Seller approval required to manage products",
      });
    }
    next();
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to verify seller approval" });
  }
};
