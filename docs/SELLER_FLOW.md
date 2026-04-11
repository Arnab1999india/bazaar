# Seller Flow — Bazaar E-Commerce Platform

**Last Updated:** 2026-03-30
**Audience:** Developers, QA, Product

---

## Overview

A seller goes through four distinct phases:

1. **Registration** — create a seller account
2. **Onboarding** — submit business details for KYC
3. **Approval** — wait for admin review
4. **Operations** — manage products, orders, and view stats

---

## Flow Diagram

```
[Register as Seller]
        |
   OTP Verification
        |
  [Seller Portal /seller]
        |
   Complete Onboarding (KYC)
        |
   Pending Approval State
        |
   [Admin Approves/Rejects]
        |
        ├── Approved → Full Seller Portal Access
        │       ├── Product Management
        │       ├── Order Management
        │       └── Dashboard Stats
        └── Rejected → Notified with reason
```

---

## Phase 1: Seller Registration

**Frontend Route:** `/auth/seller-register` (or `/auth/register` with role=seller)
**Component:** `RegisterComponent` / `SellerRegisterComponent`

### Initiate Registration
```
POST /api/auth/initiate-registration
Body: {
  name: "Jane Doe",
  email: "seller@example.com",
  password: "Seller@123",
  role: "seller"
}
Response: { message: "OTP sent to email" }
```

### Verify OTP
**Frontend Route:** `/auth/verify-otp`
```
POST /api/auth/verify-registration
Body: { email: "seller@example.com", otp: "123456" }
Response: {
  accessToken: "...",
  refreshToken: "...",
  user: { id, name, email, role: "seller" }
}
```

After OTP verification, the seller is redirected to `/seller`.

---

## Phase 2: Seller Login

**Frontend Route:** `/auth/seller-login`
**Component:** `SellerLoginComponent`

```
POST /api/auth/login
Body: { email: "seller@example.com", password: "Seller@123" }
Response: { accessToken, refreshToken, user: { role: "seller" } }
```

The auth interceptor attaches the JWT to all subsequent requests. Role guard on `/seller/**` routes ensures only sellers can access the portal.

---

## Phase 3: Seller Onboarding (KYC)

**Frontend Route:** `/seller/onboarding`
**Component:** `SellerOnboardingComponent`
**Guard:** `sellerApprovalGuard` — allows onboarding form even before approval

### Submit Onboarding
```
POST /api/sellers/onboard
Headers: Authorization: Bearer <accessToken>
Body: {
  businessName: "Jane's Store",
  legalName: "Jane Doe Pvt Ltd",
  businessType: "individual",      // individual | company | partnership
  phone: "+919876543210",
  gstNumber: "22AAAAA0000A1Z5",    // optional
  panNumber: "AAAPL1234C",         // optional
  shopAddress: {
    line1: "123 Market St",
    line2: "Shop 4",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    postalCode: "400001"
  },
  warehouseAddress: { ... },       // optional, same schema
  kycDocuments: [
    { type: "aadhaar", url: "https://cloudinary.com/..." },
    { type: "pan",     url: "https://cloudinary.com/..." }
  ]
}
Response: { success: true, data: { sellerProfile } }
```

After submission, `SellerProfile.status = "pending"`.

### Fetch My Profile
```
GET /api/sellers/me
Headers: Authorization: Bearer <accessToken>
Response: {
  data: {
    businessName, status, submittedAt, approvedAt, rejectionReason, ...
  }
}
```

### Update Profile
```
PATCH /api/sellers/me
Headers: Authorization: Bearer <accessToken>
Body: (any subset of onboarding fields)
```

---

## Phase 4: Pending Approval State

While `status = "pending"`:
- Seller can view their profile and onboarding status
- The `sellerApprovalGuard` blocks access to `/seller/products` and `/seller/orders`
- A "pending approval" banner is shown in the seller dashboard

---

## Phase 5: Operations (After Approval)

### 5.1 Seller Dashboard Stats

```
GET /api/seller/stats
Headers: Authorization: Bearer <accessToken>
Response: {
  data: {
    totalOrders,
    totalRevenue,
    pendingOrders,
    completedOrders,
    cancelledOrders,
    avgOrderValue,
    weekly: [...],
    monthly: [...],
    statusBreakdown: { pending, processing, shipped, delivered }
  }
}
```

---

### 5.2 Product Management

**Frontend Route:** `/seller/products`
**Components:** `SellerProductsComponent`, `SellerProductFormComponent`
**Middleware:** `sellerApproval` (requires approved status)

#### List My Products
```
GET /api/products?seller=me
Headers: Authorization: Bearer <accessToken>
```

#### Create Product
```
POST /api/products
Headers: Authorization: Bearer <accessToken>
Body: {
  name: "Blue Sneakers",
  description: "Comfortable running shoes",
  price: 1499,
  category: "categoryId",
  brand: "brandId",
  imageUrl: ["https://cloudinary.com/..."],
  stockStatus: "in_stock",
  totalStock: 50,
  tags: ["shoes", "sports"],
  variants: [
    { size: "UK8", color: "Blue", price: 1499, stock: 20 }
  ]
}
Response: { success: true, data: { product } }
```

#### Update Product
```
PUT /api/products/:id
Headers: Authorization: Bearer <accessToken>
Body: (any product fields to update)
```

#### Delete Product
```
DELETE /api/products/:id
Headers: Authorization: Bearer <accessToken>
```

#### Upload Product Images
```
POST /api/products/upload-images
Headers: Authorization: Bearer <accessToken>
Body: multipart/form-data (file field: "images")
Response: { data: { urls: ["https://cloudinary.com/..."] } }
```

---

### 5.3 Order Management

**Frontend Route:** `/seller/orders`
**Component:** `SellerOrdersComponent`

#### List Seller Orders
```
GET /api/seller/orders
Headers: Authorization: Bearer <accessToken>
Response: {
  data: [
    {
      orderNumber, buyer: { name, email },
      items: [...],
      totalAmount, status, createdAt
    }
  ]
}
```

#### Update Item Status
Sellers update individual line-item status (they don't control the full order):
```
PUT /api/seller/orders/:orderId/items/:itemId/status
Headers: Authorization: Bearer <accessToken>
Body: { status: "packed" }   // packed | shipped | delivered
```

---

## Seller Role Guards Summary

| Route | Guard | Condition |
|-------|-------|-----------|
| `/seller` | `roleGuard(['seller'])` | Must be logged in as seller |
| `/seller/onboarding` | `roleGuard(['seller'])` | Accessible before approval |
| `/seller/products` | `sellerApprovalGuard` | Must be approved |
| `/seller/products/new` | `sellerApprovalGuard` | Must be approved |
| `/seller/orders` | `sellerApprovalGuard` | Must be approved |

---

## Seller Portal Layout

```
SellerLayoutComponent
├── SellerHeaderComponent
├── SellerSidebarComponent (nav: Dashboard, Products, Orders)
├── SellerFooterComponent
└── <router-outlet>
    ├── SellerDashboardComponent  (/seller or /seller/dashboard)
    ├── SellerOnboardingComponent (/seller/onboarding)
    ├── SellerProductsComponent   (/seller/products)
    ├── SellerProductFormComponent(/seller/products/new, /seller/products/:id/edit)
    └── SellerOrdersComponent     (/seller/orders)
```

---

## Seller Notification Emails

| Event | Email Triggered |
|-------|----------------|
| Registration OTP | Sent by `OTPService` via `EmailService` |
| Onboarding submitted | (Planned — not yet implemented) |
| Approved by admin | (Planned — not yet implemented) |
| Rejected by admin | (Planned — not yet implemented) |
| New order received | (Planned — not yet implemented) |

---

## SellerProfile Model Reference

```typescript
{
  user: ObjectId,          // ref: User
  businessName: string,
  legalName?: string,
  businessType: string,    // individual | company | partnership
  phone: string,
  gstNumber?: string,
  panNumber?: string,
  shopAddress: Address,
  warehouseAddress?: Address,
  kycDocuments: [{ type: string, url: string }],
  status: "pending" | "approved" | "rejected",
  rejectionReason?: string,
  submittedAt: Date,
  approvedAt?: Date
}
```

---

## Error States

| Scenario | Response |
|----------|----------|
| Access seller route without seller role | Redirect to `/auth/seller-login` |
| Access products/orders before approval | Redirect to `/seller/onboarding` or pending page |
| Duplicate onboarding submission | 400 — "Profile already exists" |
| Invalid product ownership on update | 403 — "Access denied" |
| Creating product without approval | 403 — Blocked by `sellerApproval` middleware |
