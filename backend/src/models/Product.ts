import mongoose, {
  Schema,
  Document,
  Model,
  CallbackWithoutResultAndOptionalError,
} from "mongoose";
import { IProduct } from "../interfaces/product.interface";

export interface IProductDocument extends Omit<IProduct, "id">, Document {
  calculateAverageRating(): Promise<number>;
}

export interface IProductModel extends Model<IProductDocument> {
  findByCategory(category: string): Promise<IProductDocument[]>;
  searchProducts(query: string): Promise<IProductDocument[]>;
}

const productSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      index: true,
    },
    categoryPath: [
      {
        type: String,
        index: true,
      },
    ],
    brand: {
      type: String,
      ref: "Brand",
      index: true,
    },
    imageUrl: [
      {
        type: String,
        required: [true, "At least one product image is required"],
      },
    ],
    stockStatus: {
      type: String,
      enum: ["in-stock", "out-of-stock"],
      default: "in-stock",
    },
    totalStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    owner: {
      type: String,
      ref: "User",
      required: [true, "Product owner is required"],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: [
      {
        type: String,
        ref: "Review",
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        index: true,
      },
    ],
    attributes: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
          lowercase: true,
        },
        value: {
          type: String,
          required: true,
          trim: true,
          lowercase: true,
        },
      },
    ],
    variants: [
      {
        sku: {
          type: String,
          required: true,
          trim: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        stock: {
          type: Number,
          required: true,
          min: 0,
        },
        attributes: {
          type: Map,
          of: String,
        },
        imageUrls: [
          {
            type: String,
          },
        ],
      },
    ],
    locations: [
      {
        country: {
          type: String,
          trim: true,
        },
        city: {
          type: String,
          trim: true,
        },
        label: {
          type: String,
          trim: true,
        },
      },
    ],
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

// Indexes for better query performance
productSchema.index({ name: "text", description: "text" });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
// productSchema.index({ brand: 1 });
// productSchema.index({ tags: 1 });
productSchema.index({ "attributes.name": 1, "attributes.value": 1 });
productSchema.index({ owner: 1, createdAt: -1 });

// Calculate average rating method
productSchema.methods.calculateAverageRating =
  async function (): Promise<number> {
    const Review = mongoose.model("Review");
    const result = await Review.aggregate([
      { $match: { product: this._id } },
      {
        $group: {
          _id: "$product",
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const averageRating = result.length > 0 ? result[0].averageRating : 0;
    this.rating = Math.round(averageRating * 10) / 10; // Round to 1 decimal place
    await this.save();

    return this.rating;
  };

// Static methods
productSchema.statics.findByCategory = function (
  category: string
): Promise<IProductDocument[]> {
  return this.find({ category }).sort({ createdAt: -1 });
};

productSchema.statics.searchProducts = function (
  query: string
): Promise<IProductDocument[]> {
  return this.find(
    { $text: { $search: query } },
    { score: { $meta: "textScore" } }
  ).sort({ score: { $meta: "textScore" } });
};

// Middleware to clean up reviews when a product is deleted
productSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (
    this: IProductDocument,
    next: CallbackWithoutResultAndOptionalError
  ) {
    const Review = mongoose.model("Review");
    await Review.deleteMany({ product: this._id });
    next();
  }
);

productSchema.pre("save", function (next) {
  if (this.isModified("variants") && Array.isArray(this.variants)) {
    this.totalStock = this.variants.reduce(
      (acc: number, variant: { stock: number }) => acc + (variant.stock || 0),
      0
    );
    this.stockStatus = this.totalStock > 0 ? "in-stock" : "out-of-stock";
  }
  next();
});

export const Product = mongoose.model<IProductDocument, IProductModel>(
  "Product",
  productSchema
);
