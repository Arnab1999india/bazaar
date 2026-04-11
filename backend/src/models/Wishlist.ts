import mongoose, { Schema, Document } from "mongoose";

export interface IWishlistDocument extends Document {
  user: string;
  products: string[];
}

const wishlistSchema = new Schema<IWishlistDocument>(
  {
    user: { type: String, ref: "User", required: true, unique: true, index: true },
    products: [{ type: String, ref: "Product" }],
  },
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

export const Wishlist = mongoose.model<IWishlistDocument>("Wishlist", wishlistSchema);
