import mongoose, {
  Schema,
  Document,
  Model,
  CallbackWithoutResultAndOptionalError,
} from "mongoose";
import { IOrder, OrderStatus } from "../interfaces/order.interface";

export interface IOrderDocument extends Omit<IOrder, "id">, Document {
  calculateTotal(): Promise<number>;
  updateStatus(status: OrderStatus): Promise<void>;
}

export interface IOrderModel extends Model<IOrderDocument> {
  findByBuyer(buyerId: string): Promise<IOrderDocument[]>;
  findByStatus(status: OrderStatus): Promise<IOrderDocument[]>;
}

const orderSchema = new Schema<IOrderDocument>(
  {
    items: [
      {
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
        price: {
          type: Number,
          required: [true, "Price is required"],
          min: [0, "Price cannot be negative"],
        },
      },
    ],
    buyer: {
      type: String,
      ref: "User",
      required: [true, "Buyer reference is required"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    shippingAddress: {
      street: {
        type: String,
        required: [true, "Street address is required"],
      },
      city: {
        type: String,
        required: [true, "City is required"],
      },
      state: {
        type: String,
        required: [true, "State is required"],
      },
      country: {
        type: String,
        required: [true, "Country is required"],
      },
      zipCode: {
        type: String,
        required: [true, "ZIP code is required"],
      },
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
    },
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
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ "items.product": 1 });

// Calculate total amount method
orderSchema.methods.calculateTotal = async function (): Promise<number> {
  this.totalAmount = this.items.reduce(
    (total: number, item: { price: number; quantity: number }) => {
      return total + item.price * item.quantity;
    },
    0
  );
  await this.save();
  return this.totalAmount;
};

// Update order status method
orderSchema.methods.updateStatus = async function (
  status: OrderStatus
): Promise<void> {
  this.status = status;
  await this.save();
};

// Static methods
orderSchema.statics.findByBuyer = function (
  buyerId: string
): Promise<IOrderDocument[]> {
  return this.find({ buyer: buyerId })
    .sort({ createdAt: -1 })
    .populate("buyer", "name email")
    .populate("items.product", "name price imageUrl");
};

orderSchema.statics.findByStatus = function (
  status: OrderStatus
): Promise<IOrderDocument[]> {
  return this.find({ status })
    .sort({ createdAt: -1 })
    .populate("buyer", "name email")
    .populate("items.product", "name price imageUrl");
};

// Pre-save middleware to ensure totalAmount is calculated
orderSchema.pre(
  "save",
  async function (
    this: IOrderDocument,
    next: CallbackWithoutResultAndOptionalError
  ) {
    if (this.isModified("items")) {
      await this.calculateTotal();
    }
    next();
  }
);

export const Order = mongoose.model<IOrderDocument, IOrderModel>(
  "Order",
  orderSchema
);
