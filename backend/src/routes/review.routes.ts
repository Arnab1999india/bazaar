import { Router } from "express";
import { ReviewController } from "../controllers/review.controller";
import { auth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const reviewController = new ReviewController();

// Public routes
router.get(
  "/product/:productId",
  asyncHandler(reviewController.getReviewsByProduct)
);

// Protected routes (require authentication)
router.post("/", auth, asyncHandler(reviewController.createReview));
router.put("/:id", auth, asyncHandler(reviewController.updateReview));
router.delete("/:id", auth, asyncHandler(reviewController.deleteReview));

export default router;
