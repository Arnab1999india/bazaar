import mongoose, { Schema, Document, Model } from "mongoose";
import { ICategory } from "../interfaces/category.interface";

export interface ICategoryDocument
  extends Omit<ICategory, "id">,
    Document {}

export interface ICategoryModel extends Model<ICategoryDocument> {
  getCategoryTree(): Promise<ICategoryDocument[]>;
}

const categorySchema = new Schema<ICategoryDocument>(
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
    parentId: {
      type: String,
      ref: "Category",
      default: null,
    },
    ancestors: [
      {
        type: String,
        ref: "Category",
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

categorySchema.index({ parentId: 1 });
categorySchema.index({ ancestors: 1 });

categorySchema.statics.getCategoryTree = async function () {
  const categories = await this.find({}).lean();
  return categories as ICategoryDocument[];
};

export const Category = mongoose.model<ICategoryDocument, ICategoryModel>(
  "Category",
  categorySchema
);
