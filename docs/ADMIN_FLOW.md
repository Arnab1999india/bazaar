# Admin Flow — Bazaar E-Commerce Platform

**Last Updated:** 2026-03-30
**Audience:** Developers, QA, Platform Operations

---

## Overview

The Admin has full platform-level visibility and control:

- Platform statistics and analytics
- User management (view all users, create new admins)
- Seller approval / rejection
- Order oversight

Admins log in through a separate route and have a dedicated dashboard with 5 tabs.

---

## Flow Diagram

```
[Admin Login /auth/admin-login]
        |
   JWT Token (role: admin)
        |
   [Admin Dashboard /admin]
        |
   ├── Tab 1: Overview (platform stats)
   ├── Tab 2: Sellers (list, approve, reject)
   ├── Tab 3: Users (list all customers/sellers)
   ├── Tab 4: Orders (list all orders)
   └── Tab 5: Admins (list, create new admin)
```

---

## Admin Login

**Frontend Route:** `/auth/admin-login`
**Component:** `AdminLoginComponent`

```
POST /api/auth/login
Body: { email: "adminTest@bazaar.com", password: "Admin@123" }
Response: { accessToken, refreshToken, user: { role: "admin" } }
```

**Default admin credentials** (created via seed script):
- Email: `adminTest@bazaar.com`
- Password: `Admin@123`

**To seed the default admin:**
```bash
cd backend
npm run seed:admin
```

The `roleGuard(['admin'])` on the `/admin` route ensures only admin-role users can access the dashboard.

---

## Admin Routes (Backend)

All admin routes require `Authorization: Bearer <accessToken>` with `role: admin`.

### Platform Statistics
```
GET /api/admin/stats
Response: {
  data: {
    totalUsers,
    totalSellers,
    totalOrders,
    totalRevenue,
    pendingSellers,
    recentOrders: [...],
    userGrowth: [...]
  }
}
```

### User Management
```
GET /api/admin/users
Query: ?page=1&limit=20&role=customer&search=
Response: {
  data: {
    users: [{ id, name, email, role, isVerified, createdAt }],
    total, page, limit
  }
}
```

### Seller Management
```
GET /api/admin/sellers
Query: ?page=1&limit=20&status=pending
Response: {
  data: {
    sellers: [{ id, businessName, user: { name, email }, status, submittedAt }],
    total, page, limit
  }
}

PATCH /api/admin/sellers/:sellerId/approve
Response: { success: true, data: { sellerProfile } }

PATCH /api/admin/sellers/:sellerId/reject
Body: { reason: "Incomplete KYC documents" }
Response: { success: true, data: { sellerProfile } }
```

### Order Management
```
GET /api/admin/orders
Query: ?page=1&limit=20&status=pending
Response: {
  data: {
    orders: [...],
    total, page, limit
  }
}
```

### Admin User Management
```
GET /api/admin/users/admins
Response: { data: { admins: [...] } }

POST /api/admin/users/admins
Body: {
  name: "New Admin",
  email: "newadmin@bazaar.com",
  password: "Admin@456"
}
Response: { success: true, data: { user } }
```

---

## Admin Dashboard UI (Frontend)

**Route:** `/admin`
**Component:** `AdminDashboardComponent`
**Guard:** `roleGuard(['admin'])`

### Tab 1 — Overview
Displays platform KPIs from `GET /api/admin/stats`:
- Total users, sellers, orders
- Total platform revenue
- Pending seller approvals count
- Recent orders list

### Tab 2 — Sellers
Displays paginated seller list from `GET /api/admin/sellers`:
- Filter by status (pending / approved / rejected)
- Approve button → `PATCH /api/admin/sellers/:id/approve`
- Reject button → modal with reason → `PATCH /api/admin/sellers/:id/reject`
- View seller business details inline

### Tab 3 — Users
Displays all platform users from `GET /api/admin/users`:
- Filter by role (customer / seller / admin)
- Search by name/email
- View registration date, verification status

### Tab 4 — Orders
Displays all orders from `GET /api/admin/orders`:
- Filter by status
- View order details with buyer info

### Tab 5 — Admins
- Lists all admin accounts from `GET /api/admin/users/admins`
- Create new admin via `POST /api/admin/users/admins`
- Only existing admins can create new admins

---

## Admin Services (Frontend)

**File:** `web-client/src/app/core/services/admin.service.ts`
**File:** `web-client/src/app/core/services/admin-seller.service.ts`

```typescript
// admin.service.ts
getPlatformStats(): Observable<ApiResponse<PlatformStats>>
getUsers(params?): Observable<ApiResponse<UserList>>
getOrders(params?): Observable<ApiResponse<OrderList>>
createAdmin(data): Observable<ApiResponse<User>>
listAdmins(): Observable<ApiResponse<User[]>>

// admin-seller.service.ts
listSellers(params?): Observable<ApiResponse<SellerList>>
approveSeller(sellerId): Observable<ApiResponse<SellerProfile>>
rejectSeller(sellerId, reason): Observable<ApiResponse<SellerProfile>>
```

---

## Admin Authorization Flow

```
Request to /api/admin/*
  → auth middleware (validates JWT)
  → authorize(UserRole.ADMIN) middleware
     → checks req.user.role === 'admin'
     → 403 if not admin
  → controller
```

---

## Admin Capabilities Matrix

| Capability | Endpoint | Notes |
|------------|----------|-------|
| View platform stats | `GET /api/admin/stats` | Aggregated analytics |
| List all users | `GET /api/admin/users` | All roles |
| List all orders | `GET /api/admin/orders` | Platform-wide |
| Update any order status | `PUT /api/orders/admin/:orderId/status` | Override capability |
| List sellers pending | `GET /api/admin/sellers?status=pending` | For approval queue |
| Approve seller | `PATCH /api/admin/sellers/:id/approve` | Sets status=approved |
| Reject seller | `PATCH /api/admin/sellers/:id/reject` | Sets status=rejected + reason |
| List admin accounts | `GET /api/admin/users/admins` | Admin directory |
| Create admin | `POST /api/admin/users/admins` | Admin-only action |

---

## Seller Approval Process Detail

1. Seller submits onboarding → `SellerProfile.status = "pending"`
2. Admin sees pending count in Overview tab
3. Admin navigates to Sellers tab, filters by `status=pending`
4. Admin reviews:
   - Business name, type, contact
   - GST/PAN numbers
   - KYC document URLs
   - Shop address
5. Admin approves → `status = "approved"`, `approvedAt = now`
6. Admin rejects → `status = "rejected"`, `rejectionReason = "reason text"`
7. Seller portal reflects status change on next load

---

## Error States

| Scenario | Response |
|----------|----------|
| Non-admin accessing `/api/admin/*` | 403 — "Access denied" |
| Creating admin with duplicate email | 409 — "User already exists" |
| Approving already-approved seller | 200 (idempotent) |
| Invalid seller ID on approve/reject | 404 — "Seller not found" |
| Missing rejection reason | 400 — Joi validation error |

---

## Security Notes

- Admin tokens have the same 15-minute expiry as user tokens
- Refresh tokens expire in 7 days
- All admin API calls require a valid JWT — no session cookies
- Admin creation is only possible when authenticated as an existing admin
- No public admin registration endpoint exists
