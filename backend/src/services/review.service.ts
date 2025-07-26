import { Review } from "../models/Review";
import { Product } from "../models/Product";

export class ReviewService {
  static async createReview(reviewData: any, userId: string) {
    const review = await Review.create({
      ...reviewData,
      user: userId,
    });

    // Update product rating
    await this.updateProductRating(reviewData.product);

    return review;
  }

  static async getReviewsByProduct(productId: string) {
    return await Review.find({ product: productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });
  }

  static async updateReview(reviewId: string, updateData: any, userId: string) {
    const review = await Review.findOneAndUpdate(
      { _id: reviewId, user: userId },
      updateData,
      { new: true }
    );
    return review;
  }

  static async deleteReview(reviewId: string, userId: string) {
    const review = await Review.findOneAndDelete({
      _id: reviewId,
      user: userId,
    });
    if (review) {
      await this.updateProductRating(review.product);
    }
    return review;
  }

  private static async updateProductRating(productId: string) {
    const reviews = await Review.find({ product: productId });
    const avgRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    await Product.findByIdAndUpdate(productId, { rating: avgRating });
  }
}
