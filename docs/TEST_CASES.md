# Test Cases — Bazaar E-Commerce Platform

**Last Updated:** 2026-03-30
**Coverage:** Buyer, Seller, Admin, Payment, Guards

---

## Setup

```bash
# Backend test environment
cd backend
cp .env .env.test   # Set TEST_MONGO_URI, TEST_JWT_SECRET
npm test            # Jest + Supertest

# Frontend
cd web-client
npm test            # Karma + Jasmine
```

**Test users (seed before running):**
```
Admin:    adminTest@bazaar.com / Admin@123
Seller:   seller@test.com / Seller@123  (approved)
Customer: buyer@test.com / Buyer@123
```

---

## 1. Authentication

### TC-AUTH-001: Register with OTP (Happy Path)
**Precondition:** Email not registered
**Steps:**
1. `POST /api/auth/initiate-registration` with valid email/password/role=customer
2. Receive 200 + OTP emailed
3. `POST /api/auth/verify-registration` with email + valid OTP
4. Receive 201 + accessToken + refreshToken

**Expected:** User created, `isVerified: true`, tokens returned
**Assertions:**
```
status: 201
body.success: true
body.data.accessToken: defined
body.data.user.role: "customer"
body.data.user.isVerified: true
```

---

### TC-AUTH-002: Register with Duplicate Email
**Steps:**
1. `POST /api/auth/initiate-registration` with existing email

**Expected:** 409 Conflict
```
status: 409
body.success: false
body.message: contains "already exists"
```

---

### TC-AUTH-003: OTP Expired
**Steps:**
1. Initiate registration
2. Wait 10+ minutes (or force-expire OTP in DB)
3. `POST /api/auth/verify-registration` with expired OTP

**Expected:** 400 Bad Request
```
status: 400
body.message: contains "expired"
```

---

### TC-AUTH-004: Login — Valid Credentials
**Steps:**
1. `POST /api/auth/login` with registered email + password

**Expected:**
```
status: 200
body.data.accessToken: defined
body.data.user.email: matches input
```

---

### TC-AUTH-005: Login — Wrong Password
**Steps:**
1. `POST /api/auth/login` with correct email, wrong password

**Expected:**
```
status: 401
body.message: contains "Invalid credentials"
```

---

### TC-AUTH-006: Token Refresh
**Steps:**
1. Login to get refreshToken
2. `POST /api/auth/refresh` with refreshToken

**Expected:**
```
status: 200
body.data.accessToken: defined (new token)
```

---

### TC-AUTH-007: Expired Access Token Auto-Refresh (Frontend)
**Steps:**
1. Log in → get accessToken (15 min TTL)
2. Simulate expired token (e.g. alter localStorage)
3. Make any authenticated API call via Angular service
4. Interceptor should call refresh and retry original request

**Expected:** Original request succeeds transparently
**File:** `auth.interceptor.ts`

---

### TC-AUTH-008: Password Reset Flow
**Steps:**
1. `POST /api/auth/password-reset-request` with email
2. `POST /api/auth/verify-password-reset-otp` with OTP
3. `POST /api/auth/reset-password` with new password
4. Login with new password

**Expected:** Login succeeds with new password

---

### TC-AUTH-009: Change Password
**Precondition:** Authenticated
**Steps:**
1. `POST /api/auth/change-password` with currentPassword + newPassword

**Expected:**
```
status: 200
body.message: "Password changed"
```

---

### TC-AUTH-010: Logout
**Steps:**
1. `POST /api/auth/logout` with valid token

**Expected:**
```
status: 200
```
**Frontend:** localStorage tokens cleared, BehaviorSubject emits null

---

## 2. Cart

### TC-CART-001: Add Item to Cart (Authenticated)
**Steps:**
1. Login as customer
2. `POST /api/cart/add` `{ productId, quantity: 2 }`

**Expected:**
```
status: 200
body.data.items[0].quantity: 2
```

---

### TC-CART-002: Add Same Item Twice — Quantity Accumulates
**Steps:**
1. Add product (qty 2)
2. Add same product (qty 1)

**Expected:** `items[0].quantity: 3`

---

### TC-CART-003: Update Cart Item Quantity
**Steps:**
1. Add item (qty 2)
2. `PUT /api/cart/item/:productId` `{ quantity: 5 }`

**Expected:** `items[0].quantity: 5`

---

### TC-CART-004: Remove Item (quantity → 0)
**Steps:**
1. Add item
2. `PUT /api/cart/item/:productId` `{ quantity: 0 }`

**Expected:** Item removed from cart items array

---

### TC-CART-005: Delete Item from Cart
**Steps:**
1. Add item
2. `DELETE /api/cart/item/:productId`

**Expected:** Item no longer in cart

---

### TC-CART-006: Clear Cart
**Steps:**
1. Add 3 items
2. `DELETE /api/cart/clear`

**Expected:** `body.data.items: []`

---

### TC-CART-007: Add Out-of-Stock Product
**Precondition:** Product with stockStatus=out_of_stock
**Steps:**
1. `POST /api/cart/add` with out-of-stock productId

**Expected:**
```
status: 400
body.message: contains "out of stock"
```

---

### TC-CART-008: Guest Cart to Backend Sync (Frontend)
**Steps:**
1. Add 2 items as guest (localStorage)
2. Login
3. Check cart via `GET /api/cart`

**Expected:** Cart has items merged/synced from localStorage

---

## 3. Products

### TC-PROD-001: List Products (Public)
**Steps:**
1. `GET /api/products`

**Expected:**
```
status: 200
body.data.products: array
body.data.total: number
```

---

### TC-PROD-002: Search Products
**Steps:**
1. `GET /api/products?search=sneakers`

**Expected:** Products with "sneakers" in name/description

---

### TC-PROD-003: Filter by Category
**Steps:**
1. `GET /api/products?category=<categoryId>`

**Expected:** Only products in that category

---

### TC-PROD-004: Filter by Price Range
**Steps:**
1. `GET /api/products?minPrice=500&maxPrice=2000`

**Expected:** All returned products have `price` between 500–2000

---

### TC-PROD-005: Get Product Detail
**Steps:**
1. `GET /api/products/:id`

**Expected:**
```
status: 200
body.data.id: matches param
body.data.variants: array
```

---

### TC-PROD-006: Get Non-Existent Product
**Steps:**
1. `GET /api/products/000000000000000000000000`

**Expected:** `status: 404`

---

### TC-PROD-007: Seller Creates Product
**Precondition:** Approved seller token
**Steps:**
1. `POST /api/products` with valid product payload

**Expected:** `status: 201, body.data.product.owner = seller.id`

---

### TC-PROD-008: Unapproved Seller Cannot Create Product
**Precondition:** Pending seller token
**Steps:**
1. `POST /api/products`

**Expected:** `status: 403`

---

### TC-PROD-009: Seller Cannot Update Another Seller's Product
**Steps:**
1. Create product as Seller A
2. Attempt `PUT /api/products/:id` as Seller B

**Expected:** `status: 403`

---

## 4. Orders

### TC-ORD-001: Create Order
**Precondition:** Cart has items, user authenticated
**Steps:**
1. `POST /api/orders` with items + shippingAddress + paymentMethod

**Expected:**
```
status: 201
body.data.orderNumber: matches /ORD-\d{6}-\d{5}/
body.data.status: "pending"
body.data.paymentStatus: "pending"
```

---

### TC-ORD-002: Order Timeline on Creation
**Steps:**
1. Create order
2. `GET /api/orders/:id`

**Expected:** `body.data.timeline[0].status: "pending"`, description: "Order created"

---

### TC-ORD-003: List User Orders
**Steps:**
1. `GET /api/orders`

**Expected:** Only orders for authenticated user

---

### TC-ORD-004: Cancel Pending Order
**Steps:**
1. Create order
2. `PUT /api/orders/:id/cancel`

**Expected:**
```
body.data.status: "cancelled"
body.data.cancelledAt: defined
```

---

### TC-ORD-005: Cannot Cancel Shipped Order
**Precondition:** Order in "shipped" status
**Steps:**
1. `PUT /api/orders/:id/cancel`

**Expected:** `status: 400` with appropriate message

---

### TC-ORD-006: Order Statistics
**Steps:**
1. Create 3 orders (2 delivered, 1 cancelled)
2. `GET /api/orders/stats`

**Expected:**
```
body.data.totalOrders: 3
body.data.completedOrders: 2
body.data.cancelledOrders: 1
```

---

## 5. Payment (Razorpay)

### TC-PAY-001: Create Payment Order
**Precondition:** Valid order created
**Steps:**
1. `POST /api/payment/create-order` `{ orderId, amount: 1499 }`

**Expected:**
```
status: 200
body.data.razorpayOrderId: starts with "order_"
body.data.key: defined (Razorpay key ID)
body.data.amount: 1499
body.data.currency: "INR"
```

---

### TC-PAY-002: Payment Order for Non-Existent Order
**Steps:**
1. `POST /api/payment/create-order` with invalid orderId

**Expected:** `status: 404`

---

### TC-PAY-003: Payment Order for Another User's Order
**Steps:**
1. Create order as User A
2. Attempt create-order as User B with User A's orderId

**Expected:** `status: 403`

---

### TC-PAY-004: Verify Valid Payment Signature
**Precondition:** Have razorpayOrderId + razorpayPaymentId + valid HMAC
**Steps:**
1. `POST /api/payment/verify` with valid triplet

**Expected:**
```
status: 200
body.data.success: true
body.data.payment.status: "captured"
```
**Side effect check:**
1. `GET /api/orders/:orderId`
2. `body.data.paymentStatus: "completed"`
3. `body.data.status: "processing"`

---

### TC-PAY-005: Verify Invalid Signature
**Steps:**
1. `POST /api/payment/verify` with tampered signature

**Expected:**
```
status: 400
body.message: contains "Invalid payment signature"
```

---

### TC-PAY-006: Get Payment by Order ID
**Precondition:** Payment captured
**Steps:**
1. `GET /api/payment/order/:orderId`

**Expected:**
```
status: 200
body.data.status: "captured"
```

---

### TC-PAY-007: Razorpay Script Loads (Frontend)
**File:** `payment.service.ts`
**Steps:**
1. Call `paymentService.loadRazorpayScript()`

**Expected:** Resolves to `true`, `window.Razorpay` defined

---

### TC-PAY-008: Promo Code SAVE50 Applied (Frontend)
**File:** `payment.component.ts`
**Steps:**
1. Enter promo code "SAVE50"
2. Click Apply

**Expected:** `totals.discount: 50`

---

### TC-PAY-009: Promo Code BAZAAR10 Applied (Frontend)
**Steps:**
1. Set cart total to ₹1000
2. Apply "BAZAAR10"

**Expected:** `totals.discount: 100` (10% of 1000)

---

## 6. Seller

### TC-SELL-001: Seller Onboarding (Happy Path)
**Steps:**
1. Login as unonboarded seller
2. `POST /api/sellers/onboard` with full payload

**Expected:**
```
status: 201
body.data.status: "pending"
```

---

### TC-SELL-002: Duplicate Onboarding Rejected
**Steps:**
1. Onboard seller
2. `POST /api/sellers/onboard` again

**Expected:** `status: 400` (profile already exists)

---

### TC-SELL-003: Get Seller Profile
**Steps:**
1. `GET /api/sellers/me`

**Expected:**
```
status: 200
body.data.businessName: defined
body.data.status: "pending" | "approved" | "rejected"
```

---

### TC-SELL-004: Seller Stats
**Precondition:** Approved seller with orders
**Steps:**
1. `GET /api/seller/stats`

**Expected:**
```
status: 200
body.data.totalOrders: number
body.data.totalRevenue: number
```

---

### TC-SELL-005: Seller Lists Own Orders
**Steps:**
1. `GET /api/seller/orders`

**Expected:** Only orders where seller = authenticated seller

---

### TC-SELL-006: Seller Updates Item Status
**Precondition:** Order item in pending/processing status
**Steps:**
1. `PUT /api/seller/orders/:orderId/items/:itemId/status` `{ status: "packed" }`

**Expected:** `status: 200`

---

## 7. Admin

### TC-ADMIN-001: Get Platform Stats
**Steps:**
1. Login as admin
2. `GET /api/admin/stats`

**Expected:**
```
status: 200
body.data.totalUsers: number
body.data.totalRevenue: number
```

---

### TC-ADMIN-002: List All Users
**Steps:**
1. `GET /api/admin/users`

**Expected:**
```
status: 200
body.data.users: array
body.data.total: number
```

---

### TC-ADMIN-003: Approve Seller
**Steps:**
1. Login as admin
2. `PATCH /api/admin/sellers/:sellerId/approve`

**Expected:**
```
status: 200
body.data.status: "approved"
body.data.approvedAt: defined
```

---

### TC-ADMIN-004: Reject Seller with Reason
**Steps:**
1. `PATCH /api/admin/sellers/:sellerId/reject` `{ reason: "Incomplete docs" }`

**Expected:**
```
status: 200
body.data.status: "rejected"
body.data.rejectionReason: "Incomplete docs"
```

---

### TC-ADMIN-005: Reject Without Reason Fails Validation
**Steps:**
1. `PATCH /api/admin/sellers/:sellerId/reject` `{}` (no reason)

**Expected:** `status: 400`

---

### TC-ADMIN-006: Create New Admin
**Steps:**
1. `POST /api/admin/users/admins` `{ name, email, password }`

**Expected:**
```
status: 201
body.data.role: "admin"
```

---

### TC-ADMIN-007: Non-Admin Cannot Access Admin Routes
**Steps:**
1. Login as customer
2. `GET /api/admin/stats`

**Expected:** `status: 403`

---

### TC-ADMIN-008: List All Orders (Admin)
**Steps:**
1. `GET /api/admin/orders`

**Expected:** Orders from all users

---

## 8. Route Guards (Frontend)

### TC-GUARD-001: authGuard Redirects Unauthenticated
**Steps:**
1. Clear tokens from storage
2. Navigate to `/checkout`

**Expected:** Redirected to `/auth/login`

---

### TC-GUARD-002: roleGuard Blocks Wrong Role
**Steps:**
1. Login as customer
2. Navigate to `/admin`

**Expected:** Redirected away (to home or login)

---

### TC-GUARD-003: sellerApprovalGuard Blocks Pending Seller
**Steps:**
1. Login as pending (unapproved) seller
2. Navigate to `/seller/products`

**Expected:** Redirected to `/seller/onboarding` or pending page

---

### TC-GUARD-004: Approved Seller Accesses Products Route
**Steps:**
1. Login as approved seller
2. Navigate to `/seller/products`

**Expected:** Route accessible, products list shown

---

## 9. Auth Interceptor (Frontend)

### TC-INT-001: Access Token Attached to Requests
**Steps:**
1. Login (token in storage)
2. Make any service call (e.g. getCart())
3. Inspect outgoing HTTP request

**Expected:** `Authorization: Bearer <token>` header present

---

### TC-INT-002: 401 Triggers Token Refresh
**Steps:**
1. Login
2. Set accessToken to expired value in localStorage
3. Make authenticated API call

**Expected:**
- `POST /api/auth/refresh` called
- Original request retried with new token
- No visible failure to user

---

### TC-INT-003: Multiple Concurrent 401s — Only One Refresh
**Steps:**
1. Expire token
2. Trigger 3 simultaneous API calls

**Expected:** Only 1 refresh call made (others queue behind it)

---

### TC-INT-004: Refresh Fails → Logout
**Steps:**
1. Expire both access and refresh tokens
2. Make authenticated API call

**Expected:**
- Redirected to role-appropriate login
- Storage cleared

---

## 10. Edge Cases & Security

### TC-SEC-001: SQL/NoSQL Injection in Search
**Steps:**
1. `GET /api/products?search={"$gt":""}`

**Expected:** Sanitized query, no error, normal response

---

### TC-SEC-002: XSS in Review Comment
**Steps:**
1. `POST /api/reviews` with `comment: "<script>alert(1)</script>"`

**Expected:** Comment stored/returned as plain text, not executed

---

### TC-SEC-003: Rate Limiting
**Steps:**
1. Make 101 requests in under 15 minutes from same IP

**Expected:**
```
status: 429
message: "Too many requests..."
```

---

### TC-SEC-004: JWT with Invalid Signature Rejected
**Steps:**
1. Modify JWT payload and resign with wrong secret
2. Use in Authorization header

**Expected:** `status: 401`

---

### TC-SEC-005: Accessing Another User's Orders
**Steps:**
1. Login as User A, note an orderId
2. Login as User B
3. `GET /api/orders/<userA-orderId>`

**Expected:** `status: 403` or `404`

---

## Test Data Reference

### Valid Product Payload
```json
{
  "name": "Test Product",
  "description": "Test description for the product",
  "price": 999,
  "category": "<valid-category-id>",
  "imageUrl": ["https://example.com/image.jpg"],
  "stockStatus": "in_stock",
  "totalStock": 100
}
```

### Valid Shipping Address
```json
{
  "street": "123 Test Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "zipCode": "400001"
}
```

### Valid Seller Onboarding
```json
{
  "businessName": "Test Store",
  "businessType": "individual",
  "phone": "+919876543210",
  "shopAddress": {
    "line1": "123 Market St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "postalCode": "400001"
  }
}
```
