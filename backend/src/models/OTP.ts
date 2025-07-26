import mongoose, { Schema, Document, Model } from "mongoose";
import { IOTP } from "../interfaces/otp.interface";
import crypto from "crypto";

export interface IOTPDocument extends Omit<IOTP, "id">, Document {
  isExpired(): boolean;
  verifyOTP(otp: string): boolean;
}

export interface IOTPModel extends Model<IOTPDocument> {
  generateOTP(
    email: string,
    purpose: "registration" | "password-reset"
  ): Promise<IOTPDocument>;
  findValidOTP(
    email: string,
    purpose: "registration" | "password-reset"
  ): Promise<IOTPDocument | null>;
  cleanupExpiredOTPs(): Promise<void>;
}

const otpSchema = new Schema<IOTPDocument>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
    },
    otp: {
      type: String,
      required: [true, "OTP is required"],
    },
    purpose: {
      type: String,
      enum: ["registration", "password-reset"],
      required: [true, "Purpose is required"],
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    },
    verified: {
      type: Boolean,
      default: false,
    },
  } as const,
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.otp; // Don't expose OTP in JSON
      },
    },
  }
);

// Indexes
otpSchema.index({ email: 1, purpose: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Instance methods
otpSchema.methods.isExpired = function (): boolean {
  return Date.now() >= this.expiresAt.getTime();
};

otpSchema.methods.verifyOTP = function (otp: string): boolean {
  return this.otp === otp && !this.isExpired();
};

// Static methods
otpSchema.statics.generateOTP = async function (
  email: string,
  purpose: "registration" | "password-reset"
): Promise<IOTPDocument> {
  // Generate a 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Remove any existing unverified OTP for this email and purpose
  await this.deleteMany({
    email,
    purpose,
    verified: false,
  });

  // Create new OTP document
  const otpDoc = await this.create({
    email,
    otp,
    purpose,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
  });

  return otpDoc;
};

otpSchema.statics.findValidOTP = async function (
  email: string,
  purpose: "registration" | "password-reset"
): Promise<IOTPDocument | null> {
  return this.findOne({
    email,
    purpose,
    verified: false,
    expiresAt: { $gt: new Date() },
  });
};

otpSchema.statics.cleanupExpiredOTPs = async function (): Promise<void> {
  await this.deleteMany({
    expiresAt: { $lte: new Date() },
  });
};

// Pre-save hook to ensure email is lowercase
otpSchema.pre("save", function (next) {
  if (this.isModified("email")) {
    this.email = this.email.toLowerCase();
  }
  next();
});

export const OTP = mongoose.model<IOTPDocument, IOTPModel>("OTP", otpSchema);
