import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { auth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const productController = new ProductController();

// Public routes
router.get("/", asyncHandler(productController.getProducts));
router.get("/:id", asyncHandler(productController.getProductById));

// Protected routes (require authentication)
router.post("/", auth, asyncHandler(productController.createProduct));
router.put("/:id", auth, asyncHandler(productController.updateProduct));
router.delete("/:id", auth, asyncHandler(productController.deleteProduct));

export default router;
