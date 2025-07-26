import { Request, Response } from "express";
import { ReviewService } from "../services/review.service";

export class ReviewController {
  /**
   * Create a new review
   * @route POST /api/reviews
   */
  async createReview(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const review = await ReviewService.createReview(req.body, userId);
      res.status(201).json({ success: true, data: review });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to create review" });
    }
  }

  /**
   * Get reviews by product ID
   * @route GET /api/reviews/product/:productId
   */
  async getReviewsByProduct(req: Request, res: Response) {
    try {
      const reviews = await ReviewService.getReviewsByProduct(
        req.params.productId
      );
      res.json({ success: true, data: reviews });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch reviews" });
    }
  }

  /**
   * Update a review
   * @route PUT /api/reviews/:id
   */
  async updateReview(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const review = await ReviewService.updateReview(
        req.params.id,
        req.body,
        userId
      );
      if (!review) {
        return res
          .status(404)
          .json({ success: false, message: "Review not found" });
      }
      res.json({ success: true, data: review });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to update review" });
    }
  }

  /**
   * Delete a review
   * @route DELETE /api/reviews/:id
   */
  async deleteReview(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const deleted = await ReviewService.deleteReview(req.params.id, userId);
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Review not found" });
      }
      res.json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to delete review" });
    }
  }
}
