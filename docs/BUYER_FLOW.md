# Buyer Flow — Bazaar E-Commerce Platform

**Last Updated:** 2026-03-30
**Audience:** Developers, QA, Product

---

## Overview

The buyer (CUSTOMER role) flow covers the complete journey from discovery to post-purchase. All buyer interactions are split into two modes: **Guest** (unauthenticated) and **Authenticated**.

---

## Flow Diagram

```
[Landing Page]
      |
      ├── Browse Products (Guest allowed)
      │       |
      │       ├── Search / Filter / Category
      │       └── Product Detail Page
      │               |
      │               ├── Add to Cart (Guest: localStorage)
      │               └── View Reviews
      |
      ├── Register / Login
      │       |
      │       ├── Register (OTP flow)
      │       ├── Login (email/password)
      │       └── Google OAuth
      |
      └── Authenticated Journey
              |
              ├── Cart (synced to backend on login)
              ├── Checkout (address + summary)
              ├── Payment (Razorpay modal)
              ├── Order Confirmation
              ├── Order Tracking (profile page)
              └── Reviews / Returns
```

---

## Step-by-Step Buyer Journey

### 1. Discovery & Browsing (Guest)

**Frontend Route:** `/` → `/products`
**Backend APIs:** Public, no auth required

| Action | Endpoint | Notes |
|--------|----------|-------|
| View homepage | `GET /api/categories` | Category tree |
| Browse bestsellers | `GET /api/bestsellers` | Top-selling products |
| View deals | `GET /api/deals` | Lightning deals |
| Search products | `GET /api/products?search=keyword` | Full-text search |
| Filter products | `GET /api/products?category=&minPrice=&maxPrice=` | Multi-filter |
| View product detail | `GET /api/products/:id` | Full product info |
| View product variants | `GET /api/products/:id/variants` | SKU variants |
| View recommendations | `GET /api/products/:id/recommendations` | Similar products |
| Track view event | `POST /api/events/view` | For recently-viewed |

**Query parameters for product listing:**
```
GET /api/products
  ?search=      — full-text keyword
  &category=    — category ID or slug
  &brand=       — brand ID
  &minPrice=    — minimum price (number)
  &maxPrice=    — maximum price (number)
  &page=        — page number (default: 1)
  &limit=       — items per page (default: 20)
  &sort=        — price_asc | price_desc | newest | rating
```

---

### 2. Guest Cart

**Frontend:** `CartService` (localStorage mode)
**No backend call required while guest.**

- Items stored as JSON array in `localStorage['bazaar_cart']`
- Cart persists across page refreshes
- Cart count badge shown in header

```typescript
// Cart item structure (localStorage)
{
  product: { id, name, price, imageUrl },
  quantity: number
}
```

---

### 3. Registration (OTP Flow)

**Frontend Route:** `/auth/register`
**Component:** `RegisterComponent`

#### Step 1 — Initiate Registration
```
POST /api/auth/initiate-registration
Body: { name, email, password, role: "customer" }
Response: { message: "OTP sent to email" }
```

#### Step 2 — OTP Verification
**Frontend Route:** `/auth/verify-otp`
**Component:** `OtpValidationComponent`

```
POST /api/auth/verify-registration
Body: { email, otp }
Response: { accessToken, refreshToken, user }
```

- OTP expires in 10 minutes
- Resend available after 60 seconds:
  ```
  POST /api/auth/resend-otp
  Body: { email }
  ```

#### Post-Registration
- Tokens saved to `localStorage` (remember me) or `sessionStorage`
- User redirected to `/` (home)
- Guest cart automatically synced to backend cart

---

### 4. Login

**Frontend Route:** `/auth/login`
**Component:** `LoginComponent`

```
POST /api/auth/login
Body: { email, password }
Response: { accessToken, refreshToken, user: { id, name, email, role } }
```

**Token Storage:**
- `localStorage['bazaar_access_token']` — JWT (15 min expiry)
- `localStorage['bazaar_refresh_token']` — JWT (7 day expiry)

**Auto-Refresh:** The `authInterceptor` automatically calls `POST /api/auth/refresh` when a 401 is received, queuing concurrent requests behind a single refresh.

---

### 5. Authenticated Cart

After login, `CartService` switches from localStorage to backend mode.

| Action | Endpoint | Method |
|--------|----------|--------|
| Get cart | `/api/cart` | GET |
| Add item | `/api/cart/add` | POST |
| Update quantity | `/api/cart/item/:productId` | PUT |
| Remove item | `/api/cart/item/:productId` | DELETE |
| Clear cart | `/api/cart/clear` | DELETE |
| Get item count | `/api/cart/count` | GET |

**Add to cart payload:**
```json
{ "productId": "abc123", "quantity": 2 }
```

**Cart response structure:**
```json
{
  "success": true,
  "data": {
    "id": "cartId",
    "items": [
      {
        "product": { "id", "name", "price", "imageUrl", "stockStatus" },
        "quantity": 2
      }
    ]
  }
}
```

---

### 6. Checkout

**Frontend Route:** `/checkout` (auth required)
**Component:** `CheckoutComponent`
**Service:** `CheckoutService` (in-memory state)

Checkout collects:
- Delivery address (fullName, phone, line1, line2, city, state, postalCode)
- Payment method selection
- Order summary with pricing

**Checkout state model:**
```typescript
interface CheckoutState {
  address: DeliveryAddress;
  items: CartItem[];
  totals: OrderTotals;   // subtotal, deliveryCharge, discount, total
  paymentMethod: string;
  promoCode?: string;
}
```

On "Proceed to Payment" → state passed to `/payment` route via `CheckoutService`.

---

### 7. Payment (Razorpay)

**Frontend Route:** `/payment` (auth required)
**Component:** `PaymentComponent`

#### Full Payment Flow

```
Step 1: Create Order on backend
POST /api/orders
Body: {
  items: [{ productId, quantity }],
  shippingAddress: { street, city, state, country, zipCode },
  paymentMethod: "razorpay"
}
Response: { data: { id: "orderId", orderNumber, totalAmount } }

Step 2: Create Payment Order
POST /api/payment/create-order
Body: { orderId, amount, currency: "INR" }
Response: {
  data: {
    paymentId, razorpayOrderId, amount, currency, key
  }
}

Step 3: Open Razorpay Modal (client-side)
- Razorpay SDK loaded dynamically from checkout.razorpay.com
- User completes payment inside modal

Step 4: Verify Payment
POST /api/payment/verify
Body: {
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
}
Response: { success: true, message: "Payment verified successfully" }

Step 5: Post-payment
- Cart cleared
- Checkout state cleared
- Navigate to /profile?paymentSuccess=true
```

**Promo Codes (development):**
| Code | Discount |
|------|----------|
| `SAVE50` | ₹50 flat off |
| `BAZAAR10` | 10% of subtotal |

---

### 8. Order Tracking

**Frontend Route:** `/profile`
**Component:** `ProfileComponent`

| Action | Endpoint | Notes |
|--------|----------|-------|
| List my orders | `GET /api/orders` | Paginated, newest first |
| Order detail | `GET /api/orders/:orderId` | With timeline |
| Cancel order | `PUT /api/orders/:orderId/cancel` | Before shipped |

**Order Status Lifecycle:**
```
pending → confirmed → processing → packed → shipped → out_for_delivery → delivered
       ↘ cancelled (any time before shipped)
       ↘ returned (after delivered)
       ↘ refunded (after return approved)
```

**Order detail response includes:**
```json
{
  "orderNumber": "ORD-202603-00001",
  "items": [...],
  "totalAmount": 999,
  "status": "processing",
  "paymentStatus": "completed",
  "shippingAddress": {...},
  "shipmentTracking": { "carrier", "trackingNumber", "updates": [...] },
  "timeline": [
    { "status": "pending", "timestamp": "...", "description": "Order created" }
  ]
}
```

---

### 9. Reviews

| Action | Endpoint | Method |
|--------|----------|--------|
| List product reviews | `GET /api/reviews?productId=` | GET (public) |
| Submit review | `POST /api/reviews` | POST (auth) |
| Update review | `PUT /api/reviews/:reviewId` | PUT (auth, own) |
| Delete review | `DELETE /api/reviews/:reviewId` | DELETE (auth, own) |

**Submit review payload:**
```json
{ "productId": "abc", "rating": 4, "comment": "Great product!" }
```

---

### 10. Wishlist

**Frontend Route:** `/wishlist` (auth required)
**Note:** Wishlist UI component exists; backend endpoint not yet implemented (tracked as gap in Project Report).

---

### 11. Password Reset Flow

```
Step 1: Request reset OTP
POST /api/auth/password-reset-request
Body: { email }

Step 2: Verify OTP
POST /api/auth/verify-password-reset-otp
Body: { email, otp }

Step 3: Set new password
POST /api/auth/reset-password
Body: { email, otp, newPassword }
```

---

### 12. Logout

```
POST /api/auth/logout   (auth required)
```

Clears tokens from storage, resets auth state, redirects to `/auth/login`.

---

## Error States & Handling

| Scenario | Behavior |
|----------|----------|
| Invalid OTP | 400 — "Invalid or expired OTP" |
| Already registered email | 409 — "User already exists" |
| Wrong password | 401 — "Invalid credentials" |
| Expired access token | Interceptor auto-refreshes silently |
| Expired refresh token | Force logout → role-specific login route |
| Payment signature mismatch | 400 — "Invalid payment signature" |
| Out-of-stock item in cart | Cart save validation error |
| Order not found | 404 — "Order not found" |

---

## Frontend Components Map

| Route | Component | Auth? |
|-------|-----------|-------|
| `/` | `HomeComponent` | No |
| `/products` | `ProductListComponent` | No |
| `/products/:id` | `ProductDetailComponent` | No |
| `/auth/register` | `RegisterComponent` | No |
| `/auth/login` | `LoginComponent` | No |
| `/auth/verify-otp` | `OtpValidationComponent` | No |
| `/auth/forgot-password` | `ForgotPasswordComponent` | No |
| `/auth/reset-password` | `ResetPasswordComponent` | No |
| `/cart` | `CartComponent` | No |
| `/checkout` | `CheckoutComponent` | Yes |
| `/payment` | `PaymentComponent` | Yes |
| `/profile` | `ProfileComponent` | Yes |
| `/wishlist` | `WishlistComponent` | Yes |
