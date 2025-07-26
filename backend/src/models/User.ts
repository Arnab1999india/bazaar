import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";
import { IUser, UserRole } from "../interfaces/user.interface";

export interface IUserDocument extends Omit<IUser, "id">, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: function (this: IUserDocument) {
        // Password is required only if googleId is not present
        return !this.googleId;
      },
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allow null/undefined values
    },
    phone: {
      type: String,
      match: [/^\+?[\d\s-]+$/, "Please enter a valid phone number"],
      sparse: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
      },
    },
  }
);

// Index for faster queries
// userSchema.index({ email: 1 });
// userSchema.index({ googleId: 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    // Need to explicitly select password as it's excluded by default
    const user = await this.model("User")
      .findById(this._id)
      .select("+password");
    if (!user?.password) return false;

    return await bcrypt.compare(candidatePassword, user.password);
  } catch (error) {
    return false;
  }
};

// Handle duplicate key errors
userSchema.post("save", function (error: any, _: any, next: Function) {
  if (error.name === "MongoError" && error.code === 11000) {
    next(new Error("Email already exists"));
  } else {
    next(error);
  }
});

export const User = mongoose.model<IUserDocument>("User", userSchema);
