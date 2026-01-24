import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { auth, authorize } from "../middlewares/auth.middleware";
import { requireApprovedSeller } from "../middlewares/sellerApproval.middleware";
import { UserRole } from "../interfaces/user.interface";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const productController = new ProductController();

// Public routes
router.get(
  "/",
  asyncHandler(productController.getProducts.bind(productController))
);
router.get(
  "/:id/variants",
  asyncHandler(productController.getProductVariants.bind(productController))
);
router.get(
  "/:id/recommendations",
  asyncHandler(productController.getRecommendations.bind(productController))
);
router.get(
  "/:id",
  asyncHandler(productController.getProductById.bind(productController))
);

// Protected routes (require authentication)
router.post(
  "/",
  auth,
  authorize(UserRole.SELLER, UserRole.ADMIN),
  requireApprovedSeller,
  asyncHandler(productController.createProduct.bind(productController))
);
router.put(
  "/:id",
  auth,
  authorize(UserRole.SELLER, UserRole.ADMIN),
  requireApprovedSeller,
  asyncHandler(productController.updateProduct.bind(productController))
);
router.delete(
  "/:id",
  auth,
  authorize(UserRole.SELLER, UserRole.ADMIN),
  requireApprovedSeller,
  asyncHandler(productController.deleteProduct.bind(productController))
);

export default router;
