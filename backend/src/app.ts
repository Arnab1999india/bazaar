import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/config";
import rateLimit from "express-rate-limit";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes Placeholder
// app.use('/api/auth', authRoutes);

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
// Other routes to be implemented
// import productRoutes from './routes/product.routes';
// import orderRoutes from './routes/order.routes';
// import cartRoutes from './routes/cart.routes';
// import reviewRoutes from './routes/review.routes';
// import adminRoutes from './routes/admin.routes';

// API Routes
app.use("/api/auth", authRoutes);
// Other routes to be implemented
// app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/cart', cartRoutes);
// app.use('/api/reviews', reviewRoutes);
// app.use('/api/admin', adminRoutes);

// Swagger documentation (to be implemented)
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
