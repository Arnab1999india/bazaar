import mongoose, { Schema, Document, Model } from "mongoose";
import {
  ISellerProfile,
  SellerProfileStatus,
} from "../interfaces/sellerProfile.interface";

export interface ISellerProfileDocument
  extends Omit<ISellerProfile, "id">,
    Document {}

export interface ISellerProfileModel extends Model<ISellerProfileDocument> {
  findByUser(userId: string): Promise<ISellerProfileDocument | null>;
}

const addressSchema = new Schema(
  {
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const documentSchema = new Schema(
  {
    type: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const sellerProfileSchema = new Schema<ISellerProfileDocument>(
  {
    user: {
      type: String,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
    },
    legalName: {
      type: String,
      trim: true,
    },
    businessType: {
      type: String,
      required: [true, "Business type is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    panNumber: {
      type: String,
      trim: true,
    },
    shopAddress: {
      type: addressSchema,
      required: true,
    },
    warehouseAddress: {
      type: addressSchema,
    },
    kycDocuments: {
      type: [documentSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"] as SellerProfileStatus[],
      default: "pending",
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
    },
    approvedAt: {
      type: Date,
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

sellerProfileSchema.statics.findByUser = function (userId: string) {
  return this.findOne({ user: userId });
};

export const SellerProfile = mongoose.model<
  ISellerProfileDocument,
  ISellerProfileModel
>("SellerProfile", sellerProfileSchema);
