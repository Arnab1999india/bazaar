# Bazaar E-Commerce Platform — Full Project Report

**Date:** 2026-03-30
**Branch:** development
**Stack:** Node.js/Express + TypeScript (backend) · Angular 19 (frontend) · MongoDB

---

## Executive Summary

Bazaar is a multi-role e-commerce platform supporting three user types — Customer (buyer), Seller, and Admin. The platform is **feature-complete at the backend layer** for the core commerce flows (auth, catalog, cart, orders, payment). The frontend has full UI implementations for auth, seller portal, admin portal, cart, checkout, and payment. Several buyer-facing pages (order history detail, reviews UI, wishlist backend) are partially wired or have gaps documented below.

**Overall Readiness: ~78% end-to-end wired**

---

## 1. Tech Stack & Versions

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend runtime | Node.js + TypeScript | TS 5.x |
| Backend framework | Express.js | v5.1.0 |
| Database | MongoDB + Mongoose | v8.15.0 |
| Auth | JWT + bcrypt + Passport | bcrypt v6 |
| Payment | Razorpay | v2.9.6 |
| Image storage | Cloudinary | Latest |
| Email | Nodemailer | Latest |
| Frontend framework | Angular | v19.2.0 |
| Frontend build | Angular CLI | v19.2.0 |
| HTTP client | Angular HttpClient | v19 |
| State management | RxJS BehaviorSubject | v7 |
| CSS | SCSS | — |

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Angular SPA                       │
│   Auth  │  Buyer  │  Seller Portal  │  Admin Portal  │
│         │  Cart   │  Products       │  Dashboard     │
│         │  Checkout│ Orders         │  User Mgmt     │
│         │  Payment │ Stats          │  Seller Approval│
└───────────────────────┬─────────────────────────────┘
                        │ HTTP / JWT
┌───────────────────────▼─────────────────────────────┐
│                    Express API (Port 5000)            │
│                                                      │
│  /api/auth    /api/products   /api/orders            │
│  /api/cart    /api/payment    /api/seller/*           │
│  /api/admin/* /api/reviews    /api/stores            │
│  /api/categories  /api/brands  /api/deals            │
└───────────────────────┬─────────────────────────────┘
                        │ Mongoose
┌───────────────────────▼─────────────────────────────┐
│                    MongoDB Atlas                      │
│  Users  Products  Orders  Payments  Cart             │
│  SellerProfiles  Reviews  Brands  Categories         │
│  OTPs  Deals  ProductViews                           │
└─────────────────────────────────────────────────────┘
         │                │
    Cloudinary        Razorpay
    (Images)          (Payments)
```

---

## 3. Feature-by-Feature Status

### 3.1 Authentication & Authorization

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| OTP-based registration | ✅ Implemented | ✅ Implemented | **FULLY WIRED** |
| Email/password login | ✅ Implemented | ✅ Implemented | **FULLY WIRED** |
| JWT access + refresh tokens | ✅ Implemented | ✅ Implemented | **FULLY WIRED** |
| Token refresh (interceptor) | ✅ Endpoint ready | ✅ Auto-refresh on 401 | **FULLY WIRED** |
| Role-based guards (customer/seller/admin) | ✅ `authorize()` middleware | ✅ `authGuard`, `roleGuard` | **FULLY WIRED** |
| Google OAuth | ⚠️ Callback route exists, GET /auth/google not wired | ❌ No UI | **NOT WIRED** |
| Password reset (OTP) | ✅ Implemented | ✅ Implemented | **FULLY WIRED** |
| Change password | ✅ Implemented | ✅ Via profile | **FULLY WIRED** |
| Get/Update profile | ✅ Implemented | ✅ Implemented | **FULLY WIRED** |
| Logout | ✅ Implemented | ✅ Implemented | **FULLY WIRED** |
| OTP cleanup cron | ✅ 1-hour interval in app.ts | — | **FULLY WIRED** |

**Auth Interceptor:** Fully implemented with token queuing — multiple concurrent 401s result in exactly 1 refresh call. Role-aware logout redirects (customer → `/auth/login`, seller → `/auth/seller-login`, admin → `/auth/admin-login`).

---

### 3.2 Product Catalog

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| List products (pagination, filters) | ✅ Full implementation | ✅ ProductListComponent | **FULLY WIRED** |
| Full-text search | ✅ Text index on name/description | ✅ Search bar | **FULLY WIRED** |
| Filter by category/brand/price | ✅ Query params | ✅ Filter panel | **FULLY WIRED** |
| Product detail page | ✅ Rich model with variants | ✅ ProductDetailComponent | **FULLY WIRED** |
| Product variants | ✅ Endpoint + model | ✅ Variant selector | **FULLY WIRED** |
| Product recommendations | ✅ Endpoint | ⚠️ Component exists, wiring TBD | **PARTIALLY WIRED** |
| Category tree | ✅ `/api/categories` | ✅ Used in home | **FULLY WIRED** |
| Brand directory | ✅ `/api/brands` | ✅ Filter | **FULLY WIRED** |
| Lightning deals | ✅ `/api/deals` | ✅ Home component | **FULLY WIRED** |
| Bestsellers | ✅ `/api/bestsellers` | ✅ Home component | **FULLY WIRED** |
| Recently viewed | ✅ `/api/recently-viewed` + track event | ⚠️ Event tracked, display TBD | **PARTIALLY WIRED** |
| Product image upload (Cloudinary) | ✅ Cloudinary upload | ✅ Seller product form | **FULLY WIRED** |
| Store page | ✅ `/api/stores/:id` and `/products` | ⚠️ StoreComponent not confirmed | **PARTIALLY WIRED** |

---

### 3.3 Shopping Cart

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Get cart | ✅ Full CRUD | ✅ CartComponent + CartService | **FULLY WIRED** |
| Add item | ✅ Stock validation on save | ✅ "Add to cart" buttons | **FULLY WIRED** |
| Update quantity | ✅ qty=0 removes item | ✅ Quantity controls | **FULLY WIRED** |
| Remove item | ✅ Implemented | ✅ Remove button | **FULLY WIRED** |
| Clear cart | ✅ Implemented | ✅ On payment success | **FULLY WIRED** |
| Cart count badge | ✅ `/api/cart/count` | ✅ Header badge | **FULLY WIRED** |
| Guest cart (localStorage) | — (not needed) | ✅ localStorage fallback | **FULLY WIRED** |
| Guest→auth cart sync | ✅ On login | ✅ CartService sync | **FULLY WIRED** |

---

### 3.4 Checkout

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Checkout address form | — (stateless) | ✅ CheckoutComponent | **FULLY WIRED** |
| Checkout state service | — | ✅ CheckoutService | **FULLY WIRED** |
| Order summary | — | ✅ Shows items + totals | **FULLY WIRED** |
| Promo code input | — | ✅ SAVE50 / BAZAAR10 in PaymentComponent | **FULLY WIRED (dev only)** |
| Navigate to payment | — | ✅ Passes state to /payment | **FULLY WIRED** |

---

### 3.5 Payment (Razorpay)

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Create Razorpay order | ✅ `razorpayInstance.orders.create()` | ✅ Calls `/api/payment/create-order` | **FULLY WIRED** |
| Return key + razorpayOrderId to FE | ✅ Returns `key` from env | ✅ Used in modal options | **FULLY WIRED** |
| Load Razorpay SDK | — | ✅ Dynamic script loader | **FULLY WIRED** |
| Open Razorpay modal | — | ✅ `openRazorpayCheckout()` | **FULLY WIRED** |
| Payment signature verification (HMAC-SHA256) | ✅ Crypto-based verification | ✅ Calls `/api/payment/verify` | **FULLY WIRED** |
| Update order on payment success | ✅ status→processing, paymentStatus→completed | ✅ Navigate to /profile | **FULLY WIRED** |
| Get payment by order | ✅ Implemented | ✅ `getPaymentByOrderId()` | **FULLY WIRED** |
| Payment record persistence | ✅ Payment model | — | **FULLY WIRED** |
| Razorpay webhooks | ❌ Not implemented | ❌ Not implemented | **NOT WIRED (production gap)** |
| Refund handling | ❌ Not implemented | ❌ Not implemented | **NOT WIRED** |

---

### 3.6 Order Management

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Create order | ✅ Full logic, auto orderNumber | ✅ Called from PaymentComponent | **FULLY WIRED** |
| Order number generation (ORD-YYYYMM-NNNNN) | ✅ Pre-save hook | — | **FULLY WIRED** |
| Order timeline tracking | ✅ Status history on model | ⚠️ Not shown in ProfileComponent | **PARTIALLY WIRED** |
| List user orders | ✅ `GET /api/orders` | ⚠️ ProfileComponent has partial | **PARTIALLY WIRED** |
| Order detail view | ✅ Full response with timeline | ⚠️ No dedicated order detail page | **PARTIALLY WIRED** |
| Cancel order | ✅ `PUT /api/orders/:id/cancel` | ❌ Not in UI | **BACKEND ONLY** |
| Update order status | ✅ `PUT /api/orders/:id/status` | ❌ Not in buyer UI | **BACKEND ONLY** |
| Shipment tracking | ✅ Model + tracking schema | ❌ Not in UI | **BACKEND ONLY** |
| Return request | ✅ Model only | ❌ Not implemented | **BACKEND ONLY** |
| Admin order management | ✅ Full endpoints | ✅ Admin dashboard Tab 4 | **FULLY WIRED** |
| Order stats | ✅ Aggregation query | ✅ Seller dashboard | **FULLY WIRED** |

---

### 3.7 Seller Portal

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Seller registration | ✅ `role: "seller"` in auth | ✅ SellerRegister / Register | **FULLY WIRED** |
| Seller login (separate route) | ✅ Same `/api/auth/login` | ✅ SellerLoginComponent | **FULLY WIRED** |
| Seller onboarding (KYC form) | ✅ Full validation + schema | ✅ SellerOnboardingComponent | **FULLY WIRED** |
| Seller profile GET/PATCH | ✅ Implemented | ✅ Used in onboarding | **FULLY WIRED** |
| sellerApproval middleware | ✅ Blocks unapproved | ✅ `sellerApprovalGuard` | **FULLY WIRED** |
| Seller dashboard KPIs | ✅ `/api/seller/stats` | ✅ SellerDashboardComponent | **FULLY WIRED** |
| Product CRUD | ✅ Full with approval check | ✅ SellerProductsComponent + Form | **FULLY WIRED** |
| Product image upload | ✅ Cloudinary | ✅ SellerProductFormComponent | **FULLY WIRED** |
| Product image slides/dropdown | ✅ imageUrl array | ✅ Multiple images | **FULLY WIRED** |
| View seller orders | ✅ `/api/seller/orders` | ✅ SellerOrdersComponent | **FULLY WIRED** |
| Update item status | ✅ Per-item status | ✅ In seller orders | **FULLY WIRED** |
| Seller sidebar nav | — | ✅ SellerSidebarComponent | **FULLY WIRED** |
| Seller email notifications | ❌ Not implemented | — | **NOT WIRED** |

---

### 3.8 Admin Portal

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Admin login | ✅ Same login endpoint | ✅ AdminLoginComponent | **FULLY WIRED** |
| Seed admin script | ✅ `npm run seed:admin` | — | **FULLY WIRED** |
| Platform stats | ✅ `/api/admin/stats` | ✅ Tab 1 Overview | **FULLY WIRED** |
| List all users | ✅ `/api/admin/users` | ✅ Tab 3 Users | **FULLY WIRED** |
| List all orders | ✅ `/api/admin/orders` | ✅ Tab 4 Orders | **FULLY WIRED** |
| List sellers | ✅ `/api/admin/sellers` | ✅ Tab 2 Sellers | **FULLY WIRED** |
| Approve seller | ✅ `PATCH .../approve` | ✅ Approve button | **FULLY WIRED** |
| Reject seller | ✅ `PATCH .../reject` | ✅ Reject modal + reason | **FULLY WIRED** |
| Create new admin | ✅ `POST /api/admin/users/admins` | ✅ Tab 5 Admins form | **FULLY WIRED** |
| List admins | ✅ `GET /api/admin/users/admins` | ✅ Tab 5 Admins list | **FULLY WIRED** |
| Admin update order status | ✅ In order.routes.ts | ⚠️ Not in admin UI | **PARTIALLY WIRED** |
| Role guard on /admin | — | ✅ `roleGuard(['admin'])` | **FULLY WIRED** |

---

### 3.9 Reviews

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| List reviews (public) | ✅ Implemented | ⚠️ ProductDetailComponent partial | **PARTIALLY WIRED** |
| Submit review | ✅ Implemented | ❌ No submit form in UI | **BACKEND ONLY** |
| Update/delete review | ✅ Implemented | ❌ Not in UI | **BACKEND ONLY** |

---

### 3.10 Infrastructure & Cross-Cutting

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Rate limiting (100 req/15min) | ✅ express-rate-limit | — | **FULLY WIRED** |
| Input validation (Joi) | ✅ All routes | — | **FULLY WIRED** |
| Error handling (AppError) | ✅ Custom error class | ✅ Error messages in UI | **FULLY WIRED** |
| CORS | ✅ `origin: true` | — | **FULLY WIRED** |
| Auth interceptor | — | ✅ Token attach + refresh | **FULLY WIRED** |
| Toast notifications | — | ✅ ToastService + ToastComponent | **FULLY WIRED** |
| Cloudinary image uploads | ✅ upload.middleware.ts | ✅ Product form | **FULLY WIRED** |
| OTP email service | ✅ Nodemailer | — | **FULLY WIRED** |
| DB connection + retry | ✅ `config/config.ts` | — | **FULLY WIRED** |
| Environment config validation | ✅ `env.config.ts` | ✅ `environment.ts` | **FULLY WIRED** |

---

## 4. Identified Gaps & Missing Features

### Priority 1 — Core Buyer Experience (High Impact)

| Gap | Location | Notes |
|----|----------|-------|
| Order history list page | `/profile` component | Backend ready. Frontend shows partial; no order detail route. |
| Order detail page with timeline | No `/orders/:id` frontend route | `GET /api/orders/:id` fully implemented; needs a route + component |
| Cancel order UI | ProfileComponent | `PUT /api/orders/:id/cancel` exists; no button in UI |
| Review submission UI | ProductDetailComponent | `POST /api/reviews` exists; no form in UI |
| Wishlist backend | — | `WishlistComponent` exists; no backend API |

### Priority 2 — Seller Gaps

| Gap | Location | Notes |
|----|----------|-------|
| Seller approval email notification | EmailService | Not triggered on approve/reject |
| Seller new order notification email | EmailService | Not triggered on order creation |
| Seller onboarding status shown in portal | SellerDashboardComponent | Status not prominently displayed |

### Priority 3 — Admin Gaps

| Gap | Location | Notes |
|----|----------|-------|
| Admin order status update in UI | AdminDashboardComponent | Backend endpoint exists in order.routes.ts; not in admin dashboard UI |

### Priority 4 — Production Gaps

| Gap | Notes |
|----|-------|
| Razorpay webhooks | Needed for reliable production payment confirmation |
| Refund flow | No refund endpoint or UI |
| Google OAuth frontend flow | Backend callback exists; no UI trigger |
| Promo code backend API | Hardcoded in frontend only |
| Wishlist API | Frontend component with no backend |
| Shipment tracking UI | Model exists; no frontend view |
| Return request flow | Model exists; no endpoint or UI |

---

## 5. API Endpoint Coverage Summary

| Route Group | Total Endpoints | Wired End-to-End | Backend Only | Not Implemented |
|-------------|----------------|------------------|--------------|-----------------|
| Auth | 14 | 12 | 0 | 2 (Google OAuth init) |
| Products | 8 | 7 | 1 (recommendations display) | 0 |
| Cart | 6 | 6 | 0 | 0 |
| Orders | 7 | 2 | 5 | 0 |
| Payment | 3 | 3 | 0 | 0 |
| Seller | 5 | 5 | 0 | 0 |
| Seller Orders | 2 | 2 | 0 | 0 |
| Seller Stats | 1 | 1 | 0 | 0 |
| Admin | 5 | 5 | 0 | 0 |
| Admin Sellers | 3 | 3 | 0 | 0 |
| Reviews | 4 | 0 | 4 | 0 |
| Merchandising | 6 | 4 | 2 | 0 |
| Stores | 2 | 0 | 2 | 0 |
| **TOTAL** | **66** | **50 (76%)** | **14 (21%)** | **2 (3%)** |

---

## 6. Model Completeness

| Model | Fields | Indexes | Methods | Status |
|-------|--------|---------|---------|--------|
| User | Complete | email, role | — | ✅ |
| Product | Complete (variants, attrs) | text, price, category | — | ✅ |
| Order | Complete (timeline, tracking, return) | buyer, seller, status | `updateStatus`, `addTimelineEntry`, `getOrderStats` | ✅ |
| Payment | Complete | razorpayOrderId | — | ✅ |
| Cart | Complete | user (unique) | Stock validation pre-save | ✅ |
| SellerProfile | Complete | user | — | ✅ |
| Review | Complete | product, user | — | ✅ |
| Category | Tree structure | — | — | ✅ |
| Brand | Complete | — | — | ✅ |
| Deal | Complete | — | — | ✅ |
| OTP | Complete | email, expiresAt | — | ✅ |
| ProductView | Complete | user, product | — | ✅ |

---

## 7. Security Assessment

| Control | Status | Notes |
|---------|--------|-------|
| JWT auth on all protected routes | ✅ | Via `auth` middleware |
| Role authorization | ✅ | Via `authorize()` middleware |
| Password hashing | ✅ | bcrypt 10 rounds |
| Input validation | ✅ | Joi on all POST/PUT |
| Rate limiting | ✅ | 100 req/15min global |
| OTP expiry | ✅ | 10-minute TTL |
| Payment signature verification | ✅ | HMAC-SHA256 |
| CORS configured | ✅ | `origin: true` (tighten for production) |
| SQL/NoSQL injection | ✅ | Mongoose parameterized queries |
| Seller ownership check on products | ✅ | In product service |
| Order ownership check on payment | ✅ | In payment service |
| Admin-only route enforcement | ✅ | `authorize(UserRole.ADMIN)` |
| HTTPS | ❌ Dev only | Needed for production |
| Webhook signature verification | ❌ | Needed for production Razorpay |
| CORS whitelist | ⚠️ | `origin: true` should be restricted in prod |

---

## 8. Frontend Architecture Quality

| Aspect | Assessment |
|--------|-----------|
| Lazy loading | ✅ All feature modules lazy-loaded |
| Standalone components | ✅ Angular 19 standalone pattern throughout |
| Auth state management | ✅ BehaviorSubject in AuthService |
| HTTP interceptor | ✅ Token refresh + queuing |
| Route guards | ✅ authGuard, roleGuard, sellerApprovalGuard |
| Service layer | ✅ 15+ services, clean separation |
| API constants | ✅ Centralized in `api.constants.ts` |
| Environment config | ✅ `environment.ts` / `environment.production.ts` |
| Reactive forms | ✅ Used throughout auth and product forms |
| Error handling in UI | ⚠️ Partial — some components show errors, others silently fail |
| Loading states | ⚠️ Partial — `isProcessing` flag in payment, missing elsewhere |

---

## 9. Development Commands Reference

```bash
# Backend
cd backend
npm run dev          # Start dev server (nodemon) — port 5000
npm run build        # Compile TypeScript
npm start            # Run compiled build
npm test             # Jest tests
npm run seed:admin   # Create default admin user

# Frontend
cd web-client
npm start            # Angular dev server — port 4200
npm run build        # Production build
npm test             # Karma/Jasmine unit tests
```

---

## 10. Environment Variables Checklist

### Backend (`backend/.env`)
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://...       # Required
JWT_SECRET=<strong-secret>        # Required
JWT_EXPIRES_IN=7d                 # Required
RAZORPAY_KEY_ID=rzp_test_xxx      # Required for payments
RAZORPAY_KEY_SECRET=xxx           # Required for payments
SMTP_HOST=smtp.gmail.com          # Required for OTP emails
SMTP_PORT=587
SMTP_USER=<gmail>
SMTP_PASS=<app-password>
CLOUDINARY_CLOUD_NAME=xxx         # Required for image uploads
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
CLIENT_URL=http://localhost:4200
GOOGLE_CLIENT_ID=xxx              # Optional (Google OAuth)
GOOGLE_CLIENT_SECRET=xxx          # Optional (Google OAuth)
```

### Frontend (`web-client/src/environments/environment.ts`)
```typescript
{
  production: false,
  apiBaseUrl: 'http://localhost:5000/api',
  cloudinaryCloudName: '',         // Set for image upload in dev
  cloudinaryUploadPreset: ''       // Set for image upload in dev
}
```

---

## 11. Recommended Next Steps

### Immediate (Sprint 1)
1. **Order history page** — Add `/orders` route with list + `/orders/:id` detail component using existing `GET /api/orders` and `GET /api/orders/:id`
2. **Cancel order button** — Add in ProfileComponent calling `PUT /api/orders/:id/cancel`
3. **Review form** — Add to ProductDetailComponent using existing `POST /api/reviews`

### Short-term (Sprint 2)
4. **Wishlist API** — `POST/DELETE /api/wishlist/:productId` + `GET /api/wishlist`
5. **Seller notification emails** — Trigger on approval/rejection/new order
6. **Admin order status management** — Add to admin dashboard Tab 4
7. **Tighten CORS** — Replace `origin: true` with explicit whitelist

### Pre-production
8. **Razorpay webhooks** — `/api/payment/webhook` endpoint for server-side payment confirmation
9. **Refund flow** — `POST /api/payment/refund` via Razorpay API
10. **Google OAuth init** — Wire `GET /auth/google` to Passport.js redirect
11. **HTTPS** — TLS for all traffic
12. **Promo codes API** — Move from hardcoded frontend to `POST /api/promotions/validate`

---

## 12. Documentation Index

| Document | Path | Coverage |
|----------|------|----------|
| Buyer Flow | `docs/BUYER_FLOW.md` | Full buyer journey, all endpoints, error states |
| Seller Flow | `docs/SELLER_FLOW.md` | Registration through operations |
| Admin Flow | `docs/ADMIN_FLOW.md` | Login, dashboard tabs, capabilities |
| API Contract | `docs/API_CONTRACT.md` | All 66 endpoints with payloads/responses |
| Test Cases | `docs/TEST_CASES.md` | 50 test cases across all flows |
| Payment Guide | `docs/PAYMENT_GUIDE.md` | Razorpay dev setup, test cards, troubleshooting |
| Seller+Admin Flow | `docs/SELLER_ADMIN_FLOW.md` | Combined reference (legacy) |
| Backend HLD | `backend/docs/HLD.md` | High-level architecture |
| Backend LLD | `backend/docs/LLD.md` | Module-level design |
| Manual Testing | `backend/MANUAL_TESTING.md` | Manual test scenarios |
| Backend Tests | `backend/TEST_CASES.md` | Backend test cases |

---

*Report generated from live codebase analysis on 2026-03-30. All file paths verified against actual source.*
