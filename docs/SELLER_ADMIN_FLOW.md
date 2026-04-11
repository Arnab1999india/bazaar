# Bazaar — Seller, Admin & Buyer Flow Documentation

> Generated: March 2026
> Stack: Node.js/Express (TypeScript) + Angular + MongoDB + Razorpay

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Summary](#2-architecture-summary)
3. [Authentication System](#3-authentication-system)
4. [Buyer Flow](#4-buyer-flow)
5. [Seller Flow](#5-seller-flow)
6. [Admin Flow](#6-admin-flow)
7. [API Reference](#7-api-reference)
8. [Happy-Path Testing Guide](#8-happy-path-testing-guide)
9. [Environment Setup](#9-environment-setup)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Project Overview

Bazaar is a multi-role e-commerce marketplace:

| Role     | Portal URL           | Description |
|----------|----------------------|-------------|
| Buyer    | `/` (main app)       | Browse, cart, checkout, pay, track orders |
| Seller   | `/auth/seller-login` | Onboard, list products, manage orders & returns |
| Admin    | `/auth/admin-login`  | Approve sellers, manage users/orders, create new admins |

---

## 2. Architecture Summary

```
Bazaar/
├── backend/                  # Express + TypeScript API
│   ├── src/
│   │   ├── app.ts            # Entry point, route registration
│   │   ├── config/           # DB, env, Razorpay configs
│   │   ├── controllers/      # Request handlers
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # Express routers
│   │   ├── services/         # Business logic
│   │   ├── middlewares/      # Auth, validation
│   │   ├── interfaces/       # TypeScript types
│   │   └── scripts/          # Seed scripts
└── web-client/               # Angular 17 SPA
    └── src/app/
        ├── app.routes.ts     # Root routes
        ├── core/
        │   ├── guards/       # Auth, Role, SellerApproval guards
        │   ├── services/     # HTTP services
        │   ├── constants/    # API endpoint constants
        │   └── models/       # TypeScript interfaces
        └── features/
            ├── auth/         # Login, register, OTP pages
            ├── home/         # Landing page
            ├── products/     # Product catalog
            ├── cart/         # Shopping cart
            ├── checkout/     # Checkout flow
            ├── payment/      # Razorpay payment
            ├── profile/      # Buyer profile
            ├── seller/       # Seller portal (dashboard, products, orders)
            ├── seller-onboarding/ # Seller registration
            └── admin/        # Admin portal
```

### Backend API Base URL
```
http://localhost:5000/api
```

### Frontend Base URL
```
http://localhost:4200
```

---

## 3. Authentication System

### Token Strategy
- **Access Token**: JWT, 15-minute expiry
- **Refresh Token**: JWT, 7-day expiry
- Stored in `localStorage` (remember me) or `sessionStorage`
- Storage keys: `bazaar.auth` (tokens), `bazaar.user` (user info)

### User Roles
```typescript
enum UserRole {
  ADMIN    = 'admin',
  SELLER   = 'seller',
  CUSTOMER = 'customer',
}
```

### OTP Registration Flow
1. `POST /api/auth/initiate-registration` → creates unverified user + sends OTP email
2. `POST /api/auth/verify-registration` → verifies OTP, returns JWT tokens + user
3. Frontend stores tokens, redirects by role

### Direct Registration (no OTP)
- `POST /api/auth/register` → creates verified user directly (for testing)

---

## 4. Buyer Flow

### Step-by-step

```
1. Visit http://localhost:4200
2. Browse products on the home page / /products
3. Click "Register" → /auth/register
   - Fill: name, email, password, confirmPassword
   - Submit → OTP sent to email
4. OTP Verification → /auth/otp-validation?email=...&purpose=registration
   - Enter 6-digit OTP from email
   - On success → redirect to /  (home)
5. Login at /auth/login (for future sessions)
6. Add products to cart
7. Go to /cart → review items
8. Proceed to /checkout → fill shipping address
9. Go to /payment
   - Optionally apply promo code (SAVE50 or BAZAAR10)
   - Click "Pay Now" → Razorpay modal opens
   - Complete payment
10. Order confirmed → view in /profile
```

### Key Buyer APIs
| Action              | Method | Endpoint                     |
|---------------------|--------|------------------------------|
| Register            | POST   | `/api/auth/register`         |
| Initiate OTP reg    | POST   | `/api/auth/initiate-registration` |
| Verify OTP          | POST   | `/api/auth/verify-registration`   |
| Login               | POST   | `/api/auth/login`            |
| Add to cart         | POST   | `/api/cart/add`              |
| Get cart            | GET    | `/api/cart`                  |
| Create order        | POST   | `/api/orders`                |
| Create payment      | POST   | `/api/payment/create-order`  |
| Verify payment      | POST   | `/api/payment/verify`        |
| My orders           | GET    | `/api/orders`                |

---

## 5. Seller Flow

### 5.1 Seller Registration

```
1. Go to /auth/seller-login
2. Click "Create Seller Account" → /auth/seller-register
3. Fill the seller registration form:
   - Full Name, Email, Mobile
   - Password + Confirm Password
   - Business Type (individual / partnership / pvt_ltd_llp / registered_company)
   - Accept Terms
4. Submit → OTP sent to email
5. Verify OTP at /auth/otp-validation?email=...&purpose=registration
6. On success → redirected to /seller (Seller Dashboard)
```

### 5.2 Seller Onboarding (Business Profile)

```
1. After login, seller sees dashboard with status: "Onboarding not started"
2. Click "Start Onboarding" → /seller/onboarding
3. Fill business profile:
   - Business Name, Legal Name
   - Business Type
   - Phone Number
   - GST Number (optional), PAN Number (optional)
   - Shop Address (line1, city, state, country, postalCode)
   - Warehouse Address (optional)
   - KYC Documents (type + URL)
4. Submit → status becomes "Pending Review"
5. Wait for admin approval
```

### 5.3 Seller Dashboard (after approval)

The dashboard at `/seller` shows:

| Section | Description |
|---------|-------------|
| Status Banner | Current verification status (approved/pending/rejected) |
| KPI Cards | Total Revenue, Total Orders, Avg Order Value, Products Listed |
| Weekly Sales | Revenue + order count for last 7 days |
| Monthly Sales | Revenue + order count for current month, growth vs last month |
| Orders by Status | Count of orders in each status (pending → refunded) |
| Recent Orders | Last 5 orders with buyer, amount, status, date |

### 5.4 Seller Order Management

Navigate to `/seller/orders` to:
- View all orders
- Update order item status: `pending → processing → shipped → delivered`
- Handle cancellations, returns, refunds

### 5.5 Seller Product Management

Navigate to `/seller/products` to:
- View all listed products
- Add new product at `/seller/products/new`
- Edit product at `/seller/products/:id/edit`

> **Note**: Products/Orders pages require seller status = `approved` (enforced by `sellerApprovalGuard`)

### Key Seller APIs
| Action                  | Method | Endpoint                              |
|-------------------------|--------|---------------------------------------|
| Register (OTP)          | POST   | `/api/auth/initiate-registration` (role: seller) |
| Seller login            | POST   | `/api/auth/login`                     |
| Get seller profile      | GET    | `/api/sellers/me`                     |
| Submit onboarding       | POST   | `/api/sellers/onboard`                |
| Update profile          | PATCH  | `/api/sellers/me`                     |
| Seller dashboard stats  | GET    | `/api/seller/stats`                   |
| Seller orders           | GET    | `/api/seller/orders`                  |
| Update order item status| PATCH  | `/api/seller/orders/:orderId/items/:itemId/status` |
| List products           | GET    | `/api/products` (filter by seller)    |
| Create product          | POST   | `/api/products`                       |

---

## 6. Admin Flow

### 6.1 Initial Admin Setup (First Time)

Run the seed script once to create the default super-admin:

```bash
cd backend
npm run seed:admin
```

Default credentials:
```
Email:    adminTest@bazaar.com
Password: Admin@123
```

> **IMPORTANT**: Change the password immediately after first login.

### 6.2 Admin Login

```
1. Go to /auth/admin-login
2. Enter admin email + password
3. On success → redirected to /admin (Admin Portal)
```

> No "Create Account" link on admin login — admin accounts can only be created by existing admins.

### 6.3 Admin Portal Tabs

#### 📊 Overview Tab
Real-time platform statistics:
- **Users**: Total, buyers, sellers, pending approvals
- **Revenue**: Total, weekly, monthly, average order value
- **Orders**: Total, weekly, monthly, breakdown by all statuses

#### 🏪 Sellers Tab (Seller Approvals)
- Filter by: Pending / Approved / Rejected
- **Approve**: Click "Approve" button next to a seller
- **Reject**: Enter rejection reason + click "Reject"
- Rejected sellers can see the reason and re-submit their profile

#### 👥 Users Tab
- View all buyers and sellers (not admins)
- Filter by role: All / Buyers / Sellers
- See name, email, role, verification status, join date

#### 📦 Orders Tab
- View all platform orders
- Filter by status: all / pending / confirmed / processing / shipped / delivered / cancelled / returned / refunded

#### 🔐 Admins Tab
- View list of all admin accounts
- **Create new admin**: Click "+ Create Admin"
  - Fill: Name, Email, Password, Confirm Password
  - Submit → new admin account created
  - **Only existing admins can do this** (enforced by backend middleware)

### Key Admin APIs
| Action                  | Method | Endpoint                              |
|-------------------------|--------|---------------------------------------|
| Admin login             | POST   | `/api/auth/login`                     |
| Platform stats          | GET    | `/api/admin/stats`                    |
| List all users          | GET    | `/api/admin/users`                    |
| List all orders         | GET    | `/api/admin/orders`                   |
| List admins             | GET    | `/api/admin/users/admins`             |
| Create admin            | POST   | `/api/admin/users/admins`             |
| List seller profiles    | GET    | `/api/admin/sellers`                  |
| Approve seller          | PATCH  | `/api/admin/sellers/:sellerId/approve` |
| Reject seller           | PATCH  | `/api/admin/sellers/:sellerId/reject`  |

---

## 7. API Reference

### Authentication Headers
All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

### Common Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "pagination": { "page": 1, "limit": 20, "total": 100 }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description"
}
```

### Order Status Flow
```
PENDING → CONFIRMED → PROCESSING → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
         ↓
      CANCELLED
         ↓
      RETURNED → REFUNDED
```

### Payment Status Flow
```
PENDING → AUTHORIZED → CAPTURED
        → FAILED
        → REFUNDED
```

---

## 8. Happy-Path Testing Guide

### Prerequisites
- Backend running: `cd backend && npm run dev`
- Frontend running: `cd web-client && ng serve`
- MongoDB connected
- Email service configured (or check console for OTP logs)
- Admin seeded: `cd backend && npm run seed:admin`

---

### Test 1: Buyer Happy Path

```bash
# 1. Open browser → http://localhost:4200

# 2. Register as buyer
Navigate to: /auth/register
Fill: name="Test Buyer", email="buyer@test.com", password="Buyer@123"
→ OTP sent to email (or check backend console logs)

# 3. Verify OTP
Navigate to: /auth/otp-validation?email=buyer@test.com&purpose=registration
Enter OTP → redirected to home

# 4. Browse & add to cart
Go to /products → click a product → add to cart

# 5. Checkout
Go to /cart → Proceed to checkout
Fill shipping address → Continue

# 6. Payment
Go to /payment
Click "Pay Now" → Razorpay test modal opens
Use test card: 4111 1111 1111 1111 (expiry: any future, CVV: any)
→ Payment success → order created
```

**Verify**: Check `/profile` for order history.

---

### Test 2: Seller Happy Path

```bash
# 1. Register as seller
Navigate to: /auth/seller-register
Fill all fields, select businessType, accept terms
→ OTP sent

# 2. Verify OTP
→ Redirected to /seller (dashboard)
Status shows: "Onboarding not started"

# 3. Complete onboarding
Click "Start Onboarding" → /seller/onboarding
Fill:
  businessName: "Test Store"
  legalName: "Test Store Pvt Ltd"
  businessType: "pvt_ltd_llp"
  phone: "+91-9876543210"
  shopAddress: { line1: "123 Market St", city: "Mumbai", state: "Maharashtra", country: "India", postalCode: "400001" }
Submit → status: "Pending Review"

# 4. Wait for admin approval (do Test 3 now)
# After approval, refresh dashboard

# 5. After approval - add products
Go to /seller/products/new
Fill product details → save

# 6. View orders placed by buyers
Go to /seller/orders
Update item status to: shipped → delivered
```

---

### Test 3: Admin Happy Path

```bash
# 1. Login as admin
Navigate to: /auth/admin-login
Email: adminTest@bazaar.com
Password: Admin@123
→ Redirected to /admin

# 2. Check platform overview
Click "Overview" tab → see all platform stats

# 3. Approve the seller from Test 2
Click "Sellers" tab → filter: Pending
Find "Test Store" → click "Approve"
→ Seller now sees "Approved" status

# 4. Check users
Click "Users" tab → see all registered users

# 5. Check orders
Click "Orders" tab → see all orders

# 6. Create another admin
Click "Admins" tab → "+ Create Admin"
Fill: name="Admin 2", email="admin2@test.com", password="Admin@123"
→ New admin account created
→ Verify by logging in with new admin credentials at /auth/admin-login

# 7. Verify admin protection
Try to access /admin without being logged in → redirected to login
Try accessing with a seller or buyer account → access denied
```

---

### Test 4: Full End-to-End

```bash
# 1. Admin logs in → approves seller
# 2. Seller logs in → adds product
# 3. Buyer logs in → purchases that product
# 4. Seller sees order in /seller/orders → marks as shipped
# 5. Buyer sees updated status in /profile
# 6. Admin sees order in admin portal
```

---

## 9. Environment Setup

### Backend `.env`
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/bazaar

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Email (for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

CLIENT_URL=http://localhost:4200
```

### Frontend Environment
File: `web-client/src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5000/api',
};
```

### Running the Project
```bash
# Backend
cd backend
npm install
npm run seed:admin    # First time only
npm run dev           # Starts on port 5000

# Frontend
cd web-client
npm install
ng serve              # Starts on port 4200
```

---

## 10. Troubleshooting

### OTP not received
- Check backend console — OTP is logged in development mode
- Ensure SMTP credentials are correct in `.env`
- Check spam folder

### Login says "not a seller/admin"
- Confirm the account was registered with the correct role
- Seller accounts use `/auth/seller-login`
- Admin accounts use `/auth/admin-login`
- Buyer accounts use `/auth/login`

### Seller dashboard shows no stats
- Seller must be **approved** by admin to see stats
- Stats require at least one order placed for that seller

### Admin endpoint returns 401/403
- Ensure you're logged in as an admin (role: ADMIN in DB)
- Check the access token is valid and not expired
- Re-login if needed

### Razorpay payment fails
- Use Razorpay test credentials (key starting with `rzp_test_`)
- Test card: `4111 1111 1111 1111`, any future expiry, any CVV
- Check `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`

### Seller products page not accessible
- Seller must be **approved** (status = 'approved') by admin
- The `sellerApprovalGuard` blocks access and redirects to `/seller/onboarding`

### Route guard redirects unexpectedly
- `authGuard` → requires login → redirects to `/auth/login`
- `roleGuard(['seller'])` → requires seller role → redirects to `/profile`
- `roleGuard(['admin'])` → requires admin role → redirects to `/profile`
- `sellerApprovalGuard` → requires approved seller → redirects to `/seller/onboarding`

---

## Key File Reference

### Backend
| File | Purpose |
|------|---------|
| `backend/src/app.ts` | Express app, all route registrations |
| `backend/src/routes/admin.routes.ts` | Admin management (stats, users, orders, create admin) |
| `backend/src/routes/admin.seller.routes.ts` | Seller approval routes |
| `backend/src/routes/seller-stats.routes.ts` | Seller dashboard stats |
| `backend/src/routes/auth.routes.ts` | All auth endpoints |
| `backend/src/scripts/seed-admin.ts` | Seed initial admin account |
| `backend/src/models/User.ts` | User schema (role: admin/seller/customer) |
| `backend/src/models/SellerProfile.ts` | Seller business profile |
| `backend/src/models/Order.ts` | Order with full status tracking |

### Frontend
| File | Purpose |
|------|---------|
| `web-client/src/app/app.routes.ts` | Root routing |
| `web-client/src/app/features/auth/auth.routes.ts` | Auth pages routing |
| `web-client/src/app/features/seller/seller.routes.ts` | Seller portal routing |
| `web-client/src/app/features/admin/admin-dashboard/` | Full admin portal |
| `web-client/src/app/features/seller/pages/dashboard/` | Seller dashboard with stats |
| `web-client/src/app/features/auth/seller-login/` | Seller login + link to register |
| `web-client/src/app/features/seller-onboarding/seller-register/` | Seller registration |
| `web-client/src/app/core/services/admin.service.ts` | Admin API calls |
| `web-client/src/app/core/services/seller-stats.service.ts` | Seller stats API |
| `web-client/src/app/core/guards/` | Auth, Role, SellerApproval guards |
