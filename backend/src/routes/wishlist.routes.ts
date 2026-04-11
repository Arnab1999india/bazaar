import { Router, Response } from "express";
import { auth } from "../middlewares/auth.middleware";
import { AuthRequest } from "../middlewares/auth.middleware";
import { Wishlist } from "../models/Wishlist";
import { AppError, ErrorType } from "../interfaces/error.interface";

const router = Router();
router.use(auth);

// GET /api/wishlist — get current user's wishlist product IDs
router.get("/", async (req: AuthRequest, res: Response, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user!.id });
    res.json({ success: true, data: wishlist?.products ?? [] });
  } catch (error) {
    next(error);
  }
});

// POST /api/wishlist/:productId — add product to wishlist
router.post("/:productId", async (req: AuthRequest, res: Response, next) => {
  try {
    const { productId } = req.params;
    let wishlist = await Wishlist.findOne({ user: req.user!.id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user!.id, products: [productId] });
    } else if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }
    res.json({ success: true, data: wishlist.products });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/wishlist/:productId — remove product from wishlist
router.delete("/:productId", async (req: AuthRequest, res: Response, next) => {
  try {
    const { productId } = req.params;
    const wishlist = await Wishlist.findOne({ user: req.user!.id });
    if (wishlist) {
      wishlist.products = wishlist.products.filter((id) => id !== productId);
      await wishlist.save();
    }
    res.json({ success: true, data: wishlist?.products ?? [] });
  } catch (error) {
    next(error);
  }
});

export default router;
