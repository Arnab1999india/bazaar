import mongoose, { Schema, Document, Model } from "mongoose";
import { DealType } from "../interfaces/deal.interface";

export interface IDealDocument
  extends Document {
  productId: string;
  title: string;
  description?: string;
  discountPercentage: number;
  type: DealType;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDealModel extends Model<IDealDocument> {
  findActiveDeals(): Promise<IDealDocument[]>;
}

const dealSchema = new Schema<IDealDocument>(
  {
    productId: {
      type: String,
      ref: "Product",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    type: {
      type: String,
      enum: ["lightning", "featured", "top-offer"],
      default: "featured",
    },
    startsAt: {
      type: Date,
      required: true,
      index: true,
    },
    endsAt: {
      type: Date,
      required: true,
      index: true,
    },
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

dealSchema.index({ type: 1, startsAt: 1 });

dealSchema.statics.findActiveDeals = function () {
  const now = new Date();
  return this.find({
    startsAt: { $lte: now },
    endsAt: { $gte: now },
  })
    .sort({ startsAt: 1 })
    .populate("productId", "name price imageUrl brand rating");
};

export const Deal = mongoose.model<IDealDocument, IDealModel>(
  "Deal",
  dealSchema
);
