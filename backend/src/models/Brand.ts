import mongoose, { Schema, Document, Model } from "mongoose";
import { IBrand } from "../interfaces/brand.interface";

export interface IBrandDocument extends Omit<IBrand, "id">, Document {}

export interface IBrandModel extends Model<IBrandDocument> {}

const brandSchema = new Schema<IBrandDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    categoryIds: [
      {
        type: String,
        ref: "Category",
        index: true,
      },
    ],
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

// brandSchema.index({ categoryIds: 1 });

export const Brand = mongoose.model<IBrandDocument, IBrandModel>(
  "Brand",
  brandSchema
);
