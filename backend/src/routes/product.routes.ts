import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { auth } from "../middlewares/auth.middleware";
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
  asyncHandler(productController.createProduct.bind(productController))
);
router.put(
  "/:id",
  auth,
  asyncHandler(productController.updateProduct.bind(productController))
);
router.delete(
  "/:id",
  auth,
  asyncHandler(productController.deleteProduct.bind(productController))
);

export default router;
