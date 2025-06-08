import mongoose, { Schema, Document, Model } from "mongoose";
import { ICart, ICartItem } from "../interfaces/cart.interface";

export interface ICartDocument extends Omit<ICart, "id">, Document {
  addItem(productId: string, quantity: number): Promise<void>;
  removeItem(productId: string): Promise<void>;
  updateItemQuantity(productId: string, quantity: number): Promise<void>;
  clearCart(): Promise<void>;
  calculateTotalAmount(): Promise<number>;
}

export interface ICartModel extends Model<ICartDocument> {
  findByUser(userId: string): Promise<ICartDocument | null>;
}

const cartItemSchema = new Schema<ICartItem>({
  product: {
    type: String,
    ref: "Product",
    required: [true, "Product reference is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
} as const);

const cartSchema = new Schema<ICartDocument>(
  {
    user: {
      type: String,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    items: [cartItemSchema],
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

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ "items.product": 1 });

// Methods
cartSchema.methods.addItem = async function (
  productId: string,
  quantity: number
): Promise<void> {
  const existingItem = this.items.find(
    (item: ICartItem) => item.product.toString() === productId
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({ product: productId, quantity });
  }

  await this.save();
};

cartSchema.methods.removeItem = async function (
  productId: string
): Promise<void> {
  this.items = this.items.filter(
    (item: ICartItem) => item.product.toString() !== productId
  );
  await this.save();
};

cartSchema.methods.updateItemQuantity = async function (
  productId: string,
  quantity: number
): Promise<void> {
  const item = this.items.find(
    (item: ICartItem) => item.product.toString() === productId
  );

  if (!item) {
    throw new Error("Item not found in cart");
  }

  if (quantity <= 0) {
    await this.removeItem(productId);
    return;
  }

  item.quantity = quantity;
  await this.save();
};

cartSchema.methods.clearCart = async function (): Promise<void> {
  this.items = [];
  await this.save();
};

cartSchema.methods.calculateTotalAmount = async function (): Promise<number> {
  let total = 0;

  await this.populate("items.product", "price");

  for (const item of this.items) {
    const product = item.product as any; // Using any here as the populated product type is complex
    if (product && product.price) {
      total += product.price * item.quantity;
    }
  }

  return total;
};

// Static methods
cartSchema.statics.findByUser = function (
  userId: string
): Promise<ICartDocument | null> {
  return this.findOne({ user: userId }).populate(
    "items.product",
    "name price imageUrl stockStatus"
  );
};

// Middleware to validate stock before saving
cartSchema.pre("save", async function (next) {
  try {
    const Product = mongoose.model("Product");

    for (const item of this.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`Product ${item.product} not found`);
      }
      if (product.stockStatus === "out-of-stock") {
        throw new Error(`Product ${product.name} is out of stock`);
      }
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

export const Cart = mongoose.model<ICartDocument, ICartModel>(
  "Cart",
  cartSchema
);
