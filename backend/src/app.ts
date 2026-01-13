import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/config";
import rateLimit from "express-rate-limit";
import { OTPService } from "./services/otp.service";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.set("trust proxy", 1);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// DB connection
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use(limiter);

// Default Route
app.get("/", (_, res) => {
  res.send("API is running...");
});

// Import routes
import authRoutes from "./routes/auth.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import productRoutes from "./routes/product.routes";
import reviewRoutes from "./routes/review.routes";
import catalogRoutes from "./routes/catalog.routes";
import userRoutes from "./routes/user.routes";
import storeRoutes from "./routes/store.routes";

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api", catalogRoutes);

// Cleanup expired OTPs every hour
setInterval(async () => {
  try {
    await OTPService.cleanupExpiredOTPs();
    console.log("Expired OTPs cleaned up");
  } catch (error) {
    console.error("Error cleaning up expired OTPs:", error);
  }
}, 60 * 60 * 1000); // 1 hour

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
