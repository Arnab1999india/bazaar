# Low-Level Design (LLD)

## 1. Introduction

This document provides a detailed design of the Bazaar e-commerce backend API, including data models, API endpoints, and service-level logic for each module.

## 2. Data Models

### 2.1. User Model (`models/User.ts`)

```typescript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["customer", "admin"], default: "customer" },
  googleId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
```

### 2.2. Product Model (`models/Product.ts`)

```typescript
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  imageUrl: [{ type: String }],
  stockStatus: {
    type: String,
    enum: ["in-stock", "out-of-stock"],
    default: "in-stock",
  },
  rating: { type: Number, default: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
```

### 2.3. Cart Model (`models/Cart.ts`)

```typescript
const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: { type: Number, required: true, default: 1 },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
```

### 2.4. Order Model (`models/Order.ts`)

```typescript
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  shippingAddress: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
```

### 2.5. Review Model (`models/Review.ts`)

```typescript
const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
```

## 3. API Endpoints

### 3.1. Auth Routes (`routes/auth.routes.ts`)

- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Log in a user.
- `POST /api/auth/google`: Log in with Google.
- `POST /api/auth/change-password`: Change user password.
- `POST /api/auth/reset-password-request`: Request a password reset.

### 3.2. Product Routes (`routes/product.routes.ts`)

- `GET /api/products`: Get all products with filtering and pagination.
- `GET /api/products/:id`: Get a single product by ID.
- `POST /api/products`: Create a new product (admin only).
- `PUT /api/products/:id`: Update a product (admin only).
- `DELETE /api/products/:id`: Delete a product (admin only).

### 3.3. Cart Routes (`routes/cart.routes.ts`)

- `GET /api/cart`: Get the current user's cart.
- `POST /api/cart/add`: Add an item to the cart.
- `PUT /api/cart/update`: Update an item in the cart.
- `DELETE /api/cart/remove`: Remove an item from the cart.

### 3.4. Order Routes (`routes/order.routes.ts`)

- `GET /api/orders`: Get all orders for the current user.
- `GET /api/orders/:id`: Get a single order by ID.
- `POST /api/orders`: Create a new order.

### 3.5. Review Routes (`routes/review.routes.ts`)

- `GET /api/reviews/product/:productId`: Get all reviews for a product.
- `POST /api/reviews`: Create a new review.
- `PUT /api/reviews/:id`: Update a review.
- `DELETE /api/reviews/:id`: Delete a review.

## 4. Services

### 4.1. AuthService

- `register(userData)`: Handles user registration.
- `login(credentials)`: Handles user login.
- `changePassword(userId, passwords)`: Changes a user's password.

### 4.2. ProductService

- `createProduct(productData, userId)`: Creates a new product.
- `getProducts(query)`: Retrieves products with filtering and pagination.
- `getProductById(productId)`: Retrieves a single product.
- `updateProduct(productId, updateData, userId)`: Updates a product.
- `deleteProduct(productId, userId)`: Deletes a product.

### 4.3. CartService

- `getCart(userId)`: Retrieves a user's cart.
- `addToCart(userId, item)`: Adds an item to the cart.
- `updateCart(userId, item)`: Updates an item in the cart.
- `removeFromCart(userId, productId)`: Removes an item from the cart.

### 4.4. OrderService

- `createOrder(userId, orderData)`: Creates a new order.
- `getOrders(userId)`: Retrieves a user's orders.
- `getOrderById(orderId, userId)`: Retrieves a single order.

### 4.5. ReviewService

- `createReview(reviewData, userId)`: Creates a new review.
- `getReviewsByProduct(productId)`: Retrieves reviews for a product.
- `updateReview(reviewId, updateData, userId)`: Updates a review.
- `deleteReview(reviewId, userId)`: Deletes a review.
