import { Response, NextFunction, RequestHandler } from "express";
import { AuthRequest } from "./auth.middleware";
import { UserRole } from "../interfaces/user.interface";
import { SellerProfile } from "../models/SellerProfile";

export const requireApprovedSeller: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  if (!user) {
    res
      .status(401)
      .json({ success: false, message: "Authentication required" });
    return;
  }

  if (user.role === UserRole.ADMIN) {
    next();
    return;
  }

  if (user.role !== UserRole.SELLER) {
    res
      .status(403)
      .json({ success: false, message: "Seller role required" });
    return;
  }

  try {
    const profile = await SellerProfile.findOne({ user: user.id }).lean();
    if (!profile || profile.status !== "approved") {
      res.status(403).json({
        success: false,
        message: "Seller approval required to manage products",
      });
      return;
    }
    next();
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to verify seller approval" });
  }
};
