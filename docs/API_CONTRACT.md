# API Contract — Bazaar E-Commerce Platform

**Last Updated:** 2026-03-30
**Base URL:** `http://localhost:5000/api`
**Auth:** Bearer token in `Authorization` header

---

## Conventions

- All responses: `{ success: boolean, data?: any, message?: string, errors?: any[] }`
- Timestamps: ISO 8601 UTC strings
- IDs: MongoDB ObjectId as string
- Pagination: `{ data: [], total: number, page: number, limit: number }`
- Error format: `{ success: false, message: string, errors?: [{ field, message }] }`
- Rate limit: 100 requests / 15 minutes per IP

---

## Authentication

### POST /api/auth/register
Direct registration (no OTP).

**Request:**
```json
{ "name": "John Doe", "email": "john@example.com", "password": "Pass@123", "role": "customer" }
```
**Response 201:**
```json
{ "success": true, "data": { "user": { "id", "name", "email", "role" }, "accessToken", "refreshToken" } }
```
**Errors:** 400 validation, 409 email taken

---

### POST /api/auth/initiate-registration
Step 1 of OTP registration. Sends OTP email.

**Request:**
```json
{ "name": "John Doe", "email": "john@example.com", "password": "Pass@123", "role": "customer" }
```
**Response 200:**
```json
{ "success": true, "message": "OTP sent to email" }
```
**Errors:** 400 validation, 409 email taken

---

### POST /api/auth/verify-registration
Step 2 of OTP registration. Verifies OTP and creates account.

**Request:**
```json
{ "email": "john@example.com", "otp": "123456" }
```
**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": { "id", "name", "email", "role", "isVerified" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```
**Errors:** 400 invalid/expired OTP, 404 pending registration not found

---

### POST /api/auth/login

**Request:**
```json
{ "email": "john@example.com", "password": "Pass@123" }
```
**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": { "id", "name", "email", "role" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```
**Errors:** 401 invalid credentials, 403 account not verified

---

### POST /api/auth/refresh

**Request:**
```json
{ "refreshToken": "eyJ..." }
```
**Response 200:**
```json
{ "success": true, "data": { "accessToken", "refreshToken" } }
```
**Errors:** 401 invalid/expired refresh token

---

### POST /api/auth/logout
**Auth:** Required

**Response 200:**
```json
{ "success": true, "message": "Logged out successfully" }
```

---

### GET /api/auth/profile
**Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id", "name", "firstName", "lastName", "email", "role",
    "phone", "bio", "dateOfBirth", "location", "isVerified"
  }
}
```

---

### PATCH /api/auth/profile
**Auth:** Required

**Request:** (any subset)
```json
{ "firstName": "John", "lastName": "Doe", "phone": "+91...", "bio": "..." }
```
**Response 200:** Updated user object

---

### POST /api/auth/change-password
**Auth:** Required

**Request:**
```json
{ "currentPassword": "Pass@123", "newPassword": "NewPass@456" }
```
**Response 200:** `{ "success": true, "message": "Password changed" }`

---

### POST /api/auth/password-reset-request

**Request:**
```json
{ "email": "john@example.com" }
```
**Response 200:** `{ "success": true, "message": "OTP sent" }`

---

### POST /api/auth/verify-password-reset-otp

**Request:**
```json
{ "email": "john@example.com", "otp": "123456" }
```
**Response 200:** `{ "success": true, "message": "OTP verified" }`

---

### POST /api/auth/reset-password

**Request:**
```json
{ "email": "john@example.com", "otp": "123456", "newPassword": "NewPass@456" }
```
**Response 200:** `{ "success": true, "message": "Password reset successful" }`

---

### POST /api/auth/resend-otp

**Request:**
```json
{ "email": "john@example.com" }
```
**Response 200:** `{ "success": true, "message": "OTP resent" }`

---

## Products

### GET /api/products

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| search | string | - | Full-text search |
| category | string | - | Category ID |
| brand | string | - | Brand ID |
| minPrice | number | - | Minimum price |
| maxPrice | number | - | Maximum price |
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| sort | string | newest | price_asc \| price_desc \| newest \| rating |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id", "name", "description", "price",
        "imageUrl": ["url1", "url2"],
        "category", "brand", "rating", "totalStock", "stockStatus",
        "owner": { "id", "name" }
      }
    ],
    "total": 100, "page": 1, "limit": 20
  }
}
```

---

### GET /api/products/:id

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id", "name", "description", "price",
    "imageUrl": [], "category", "brand",
    "variants": [{ "size", "color", "price", "stock" }],
    "attributes": {}, "tags": [],
    "rating", "totalStock", "stockStatus", "owner"
  }
}
```
**Errors:** 404 product not found

---

### GET /api/products/:id/variants
**Response 200:** `{ "success": true, "data": { "variants": [...] } }`

---

### GET /api/products/:id/recommendations
**Response 200:** `{ "success": true, "data": { "products": [...] } }`

---

### POST /api/products
**Auth:** Required (seller or admin, approved seller)

**Request:**
```json
{
  "name": "Blue Sneakers",
  "description": "Comfortable running shoes",
  "price": 1499,
  "category": "categoryId",
  "brand": "brandId",
  "imageUrl": ["https://cloudinary.com/..."],
  "stockStatus": "in_stock",
  "totalStock": 50,
  "tags": ["shoes", "sports"],
  "variants": [{ "size": "UK8", "color": "Blue", "price": 1499, "stock": 20 }]
}
```
**Response 201:** `{ "success": true, "data": { "product": {...} } }`

---

### PUT /api/products/:id
**Auth:** Required (owner seller or admin)

**Request:** Any subset of product fields
**Response 200:** Updated product

---

### DELETE /api/products/:id
**Auth:** Required (owner seller or admin)

**Response 200:** `{ "success": true, "message": "Product deleted" }`

---

### POST /api/products/upload-images
**Auth:** Required (seller or admin)

**Request:** `multipart/form-data` with `images` field
**Response 200:** `{ "success": true, "data": { "urls": ["https://..."] } }`

---

## Cart

### GET /api/cart
**Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "cartId",
    "items": [
      { "product": { "id", "name", "price", "imageUrl", "stockStatus" }, "quantity": 2 }
    ]
  }
}
```

---

### GET /api/cart/count
**Auth:** Required

**Response 200:** `{ "success": true, "data": { "count": 3 } }`

---

### POST /api/cart/add
**Auth:** Required

**Request:**
```json
{ "productId": "abc123", "quantity": 2 }
```
**Response 200:** Updated cart
**Errors:** 400 insufficient stock, 404 product not found

---

### PUT /api/cart/item/:productId
**Auth:** Required

**Request:**
```json
{ "quantity": 3 }
```
**Response 200:** Updated cart (quantity: 0 removes item)

---

### DELETE /api/cart/item/:productId
**Auth:** Required

**Response 200:** Updated cart

---

### DELETE /api/cart/clear
**Auth:** Required

**Response 200:** `{ "success": true, "message": "Cart cleared" }`

---

## Orders

### POST /api/orders
**Auth:** Required

**Request:**
```json
{
  "items": [{ "productId": "abc", "quantity": 2 }],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "zipCode": "400001"
  },
  "paymentMethod": "razorpay",
  "paymentProvider": "razorpay"
}
```
**Response 201:**
```json
{
  "success": true,
  "data": {
    "id", "orderNumber", "items", "totalAmount",
    "status": "pending", "paymentStatus": "pending"
  }
}
```

---

### GET /api/orders
**Auth:** Required

**Query:** `?page=1&limit=10&status=`
**Response 200:** Paginated order list for authenticated user

---

### GET /api/orders/:orderId
**Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id", "orderNumber", "items", "buyer", "seller",
    "subtotal", "discount", "deliveryCharge", "tax", "totalAmount",
    "status", "paymentStatus", "paymentMethod",
    "shippingAddress", "billingAddress",
    "shipmentTracking": { "carrier", "trackingNumber", "updates": [] },
    "timeline": [{ "status", "timestamp", "description" }],
    "returnRequest": null,
    "createdAt", "updatedAt"
  }
}
```

---

### GET /api/orders/stats
**Auth:** Required

**Response 200:**
```json
{
  "data": {
    "totalOrders", "totalRevenue", "pendingOrders",
    "completedOrders", "cancelledOrders", "avgOrderValue"
  }
}
```

---

### PUT /api/orders/:orderId/status
**Auth:** Required

**Request:**
```json
{ "status": "cancelled" }
```
Valid values: `pending | processing | shipped | delivered | cancelled`

---

### PUT /api/orders/:orderId/cancel
**Auth:** Required

**Response 200:** `{ "success": true, "message": "Order cancelled" }`

---

## Payment (Razorpay)

### POST /api/payment/create-order
**Auth:** Required

**Request:**
```json
{ "orderId": "mongoOrderId", "amount": 1499, "currency": "INR" }
```
**Response 200:**
```json
{
  "success": true,
  "data": {
    "paymentId": "paymentDocId",
    "razorpayOrderId": "order_xyz",
    "amount": 1499,
    "currency": "INR",
    "key": "rzp_test_xxx"
  }
}
```
**Errors:** 404 order not found, 403 not order owner

---

### POST /api/payment/verify
**Auth:** Required

**Request:**
```json
{
  "razorpayOrderId": "order_xyz",
  "razorpayPaymentId": "pay_abc",
  "razorpaySignature": "hmac_sha256_hex"
}
```
**Response 200:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Payment verified successfully",
    "payment": { "id", "status": "captured", "razorpayPaymentId" }
  }
}
```
**Side effect:** Order `status → "processing"`, `paymentStatus → "completed"`
**Errors:** 400 invalid signature, 404 payment not found

---

### GET /api/payment/order/:orderId
**Auth:** Required

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id", "razorpayOrderId", "razorpayPaymentId",
    "amount", "currency", "status", "orderId"
  }
}
```

---

## Seller

### GET /api/sellers/me
**Auth:** Required (seller)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id", "businessName", "businessType", "phone",
    "gstNumber", "panNumber", "shopAddress", "warehouseAddress",
    "kycDocuments": [], "status", "submittedAt", "approvedAt"
  }
}
```

---

### POST /api/sellers/onboard
**Auth:** Required (seller)

**Request:**
```json
{
  "businessName": "Jane's Store",
  "businessType": "individual",
  "phone": "+91...",
  "shopAddress": { "line1", "city", "state", "country", "postalCode" },
  "kycDocuments": [{ "type": "aadhaar", "url": "https://..." }]
}
```
**Response 201:** Created seller profile

---

### PATCH /api/sellers/me
**Auth:** Required (seller)

**Request:** Any subset of onboarding fields
**Response 200:** Updated seller profile

---

### GET /api/seller/stats
**Auth:** Required (seller)

**Response 200:**
```json
{
  "data": {
    "totalOrders", "totalRevenue", "pendingOrders",
    "completedOrders", "cancelledOrders", "avgOrderValue",
    "weekly": [...], "monthly": [...],
    "statusBreakdown": { "pending", "processing", "shipped", "delivered" }
  }
}
```

---

## Seller Orders

### GET /api/seller/orders
**Auth:** Required (seller)

**Response 200:** Orders where seller = authenticated seller user

---

### PUT /api/seller/orders/:orderId/items/:itemId/status
**Auth:** Required (seller)

**Request:**
```json
{ "status": "packed" }
```
Valid: `packed | shipped | delivered`

---

## Admin Sellers

### GET /api/admin/sellers
**Auth:** Required (admin)

**Query:** `?page=1&limit=20&status=pending`
**Response 200:** Paginated seller list

---

### PATCH /api/admin/sellers/:sellerId/approve
**Auth:** Required (admin)

**Response 200:** Updated seller profile (status: approved)

---

### PATCH /api/admin/sellers/:sellerId/reject
**Auth:** Required (admin)

**Request:**
```json
{ "reason": "Incomplete KYC documents" }
```
**Response 200:** Updated seller profile (status: rejected)

---

## Admin

### GET /api/admin/stats
**Auth:** Required (admin)

**Response 200:**
```json
{
  "data": {
    "totalUsers", "totalSellers", "totalOrders",
    "totalRevenue", "pendingSellers",
    "recentOrders": [...], "userGrowth": [...]
  }
}
```

---

### GET /api/admin/users
**Auth:** Required (admin)

**Query:** `?page=1&limit=20&role=customer&search=`
**Response 200:** Paginated user list

---

### GET /api/admin/orders
**Auth:** Required (admin)

**Query:** `?page=1&limit=20&status=`
**Response 200:** Paginated order list (all users)

---

### GET /api/admin/users/admins
**Auth:** Required (admin)

**Response 200:** List of admin accounts

---

### POST /api/admin/users/admins
**Auth:** Required (admin)

**Request:**
```json
{ "name": "New Admin", "email": "admin2@bazaar.com", "password": "Admin@456" }
```
**Response 201:** Created admin user

---

## Merchandising

### GET /api/categories
**Response 200:** Category tree with nested subcategories

### GET /api/brands
**Response 200:** Brand list

### GET /api/deals
**Response 200:** Active lightning deals

### GET /api/bestsellers
**Response 200:** Top-selling products

### GET /api/recently-viewed
**Auth:** Optional
**Response 200:** Recently viewed products for the user

### POST /api/events/view
**Auth:** Optional

**Request:**
```json
{ "productId": "abc123" }
```
**Response 200:** `{ "success": true }`

---

## Reviews

### GET /api/reviews
**Query:** `?productId=abc`

**Response 200:**
```json
{
  "data": [
    { "id", "user": { "id", "name" }, "rating", "comment", "createdAt" }
  ]
}
```

---

### POST /api/reviews
**Auth:** Required

**Request:**
```json
{ "productId": "abc", "rating": 4, "comment": "Great product!" }
```
**Response 201:** Created review

---

### PUT /api/reviews/:reviewId
**Auth:** Required (review owner)

**Request:**
```json
{ "rating": 5, "comment": "Updated review" }
```

---

### DELETE /api/reviews/:reviewId
**Auth:** Required (review owner)

**Response 200:** `{ "success": true, "message": "Review deleted" }`

---

## Stores

### GET /api/stores/:sellerId
**Response 200:** Seller store overview (businessName, description, rating, etc.)

### GET /api/stores/:sellerId/products
**Query:** `?page=1&limit=20`
**Response 200:** Products for this seller's store

---

## Users

### GET /api/users/me
**Auth:** Required

**Response 200:** Current user profile

### GET /api/users/profile
**Auth:** Required

**Response 200:** Full profile with order count, etc.

---

## HTTP Status Code Reference

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/expired token) |
| 403 | Forbidden (insufficient role/ownership) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |
