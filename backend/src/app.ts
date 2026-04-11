import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import cookieParser from "cookie-parser";
import connectDB from "./config/config";
import rateLimit from "express-rate-limit";
import { OTPService } from "./services/otp.service";
import { notificationService } from "./services/notification.service";

const envPathFromRoot = path.resolve(process.cwd(), ".env");
const envPathFromBackend = path.resolve(process.cwd(), "backend", ".env");
const resolvedEnvPath = process.env.DOTENV_PATH
  ? process.env.DOTENV_PATH
  : fs.existsSync(envPathFromRoot)
    ? envPathFromRoot
    : envPathFromBackend;
dotenv.config({ path: resolvedEnvPath });
const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.io for real-time notifications
notificationService.init(httpServer);

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
import sellerRoutes from "./routes/seller.routes";
import adminSellerRoutes from "./routes/admin.seller.routes";
import sellerOrderRoutes from "./routes/seller-order.routes";
import paymentRoutes from "./routes/payment.routes";
import adminRoutes from "./routes/admin.routes";
import sellerStatsRoutes from "./routes/seller-stats.routes";
import wishlistRoutes from "./routes/wishlist.routes";
import webhookRoutes from "./routes/webhook.routes";

// Webhooks (must be registered before express.json() parses body)
app.use("/api/webhooks", webhookRoutes);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/admin/sellers", adminSellerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/seller/orders", sellerOrderRoutes);
app.use("/api/seller", sellerStatsRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api", catalogRoutes);

// Cleanup expired OTPs every hour
setInterval(
  async () => {
    try {
      await OTPService.cleanupExpiredOTPs();
      console.log("Expired OTPs cleaned up");
    } catch (error) {
      console.error("Error cleaning up expired OTPs:", error);
    }
  },
  60 * 60 * 1000,
); // 1 hour

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
