import mongoose, {
  Schema,
  Document,
  Model,
  CallbackWithoutResultAndOptionalError,
} from "mongoose";
import { IReview } from "../interfaces/review.interface";

export interface IReviewDocument extends Omit<IReview, "id">, Document {
  updateReview(rating: number, comment: string): Promise<void>;
}

export interface IReviewModel extends Model<IReviewDocument> {
  findByProduct(productId: string): Promise<IReviewDocument[]>;
  findByUser(userId: string): Promise<IReviewDocument[]>;
  getAverageRating(productId: string): Promise<number>;
}

const reviewSchema = new Schema<IReviewDocument>(
  {
    product: {
      type: String,
      ref: "Product",
      required: [true, "Product reference is required"],
    },
    user: {
      type: String,
      ref: "User",
      required: [true, "User reference is required"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be more than 5"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      maxlength: [500, "Comment cannot be more than 500 characters"],
    },
  } as const,
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// Compound index to ensure one review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });

// Methods
reviewSchema.methods.updateReview = async function (
  rating: number,
  comment: string
): Promise<void> {
  this.rating = rating;
  this.comment = comment;
  await this.save();

  // Update product's average rating
  await (this.constructor as IReviewModel).getAverageRating(this.product);
};

// Static methods
reviewSchema.statics.findByProduct = function (
  productId: string
): Promise<IReviewDocument[]> {
  return this.find({ product: productId })
    .sort({ createdAt: -1 })
    .populate("user", "name")
    .exec();
};

reviewSchema.statics.findByUser = function (
  userId: string
): Promise<IReviewDocument[]> {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate("product", "name imageUrl")
    .exec();
};

reviewSchema.statics.getAverageRating = async function (
  productId: string
): Promise<number> {
  const result = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  const averageRating = result.length > 0 ? result[0].averageRating : 0;

  // Update product's rating
  const Product = mongoose.model("Product");
  await Product.findByIdAndUpdate(productId, {
    rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
  });

  return averageRating;
};

// Middleware
reviewSchema.pre(
  "save",
  async function (
    this: IReviewDocument,
    next: CallbackWithoutResultAndOptionalError
  ) {
    if (this.isModified("rating")) {
      await (this.constructor as IReviewModel).getAverageRating(this.product);
    }
    next();
  }
);

reviewSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (
    this: IReviewDocument,
    next: CallbackWithoutResultAndOptionalError
  ) {
    await (this.constructor as IReviewModel).getAverageRating(this.product);

    // Remove review reference from product
    const Product = mongoose.model("Product");
    await Product.findByIdAndUpdate(this.product, {
      $pull: { reviews: this._id },
    });

    next();
  }
);

// Validation middleware to check if product and user exist
reviewSchema.pre(
  "save",
  async function (
    this: IReviewDocument,
    next: CallbackWithoutResultAndOptionalError
  ) {
    if (this.isNew) {
      const [Product, User] = await Promise.all([
        mongoose.model("Product").findById(this.product),
        mongoose.model("User").findById(this.user),
      ]);

      if (!Product) {
        next(new Error("Product not found"));
        return;
      }

      if (!User) {
        next(new Error("User not found"));
        return;
      }

      // Add review reference to product
      await Product.updateOne({
        $addToSet: { reviews: this._id },
      });
    }
    next();
  }
);

export const Review = mongoose.model<IReviewDocument, IReviewModel>(
  "Review",
  reviewSchema
);
