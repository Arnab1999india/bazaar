import mongoose, { Schema, Document, Model } from "mongoose";
import { IProductView } from "../interfaces/productView.interface";

export interface IProductViewDocument
  extends Omit<IProductView, "id">,
    Document {}

export interface IProductViewModel extends Model<IProductViewDocument> {
  logView(data: Partial<IProductView>): Promise<IProductViewDocument>;
}

const productViewSchema = new Schema<IProductViewDocument>(
  {
    productId: {
      type: String,
      ref: "Product",
      required: true,
      index: true,
    },
    userId: {
      type: String,
      ref: "User",
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    ipAddress: {
      type: String,
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

productViewSchema.index({ createdAt: -1 });
productViewSchema.index({ userId: 1, createdAt: -1 });

productViewSchema.statics.logView = async function (data: Partial<IProductView>) {
  const view = await this.create({
    productId: data.productId,
    userId: data.userId || null,
    sessionId: data.sessionId || null,
    ipAddress: data.ipAddress || null,
  });
  return view;
};

export const ProductView = mongoose.model<
  IProductViewDocument,
  IProductViewModel
>("ProductView", productViewSchema);
