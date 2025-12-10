# Backend API Test Cases

## 1. Authentication

> Base URL: `http://localhost:5000/api`

| Scenario | Method | Endpoint | Notes |
| --- | --- | --- | --- |
| Register customer | POST | `/auth/register` | Body: `{ "name": "Jane Doe", "email": "jane@example.com", "password": "Password123" }` |
| Login | POST | `/auth/login` | Use credentials from registration; capture JWT token from response |
| Refresh JWT (if applicable) | POST | `/auth/refresh` | Provide refresh token returned during login |
| Logout | POST | `/auth/logout` | Requires Authorization header |

All subsequent protected requests must include `Authorization: Bearer <token>`.

---

## 2. Product Catalog

### 2.1 List Products

- **Method:** GET  
- **Endpoint:** `/products`
- **Common Query Parameters:**
  - `q=iphone` – text search
  - `category=electronics` – category slug or name
  - `brand=apple` – brand slug
  - `attributes[color]=black&attributes[size]=m` – attribute filters
  - `minPrice=1000&maxPrice=2000`
  - `inStock=true`
  - `ratingGte=4`
  - `sort=price` (`price`, `rating`, `createdAt`, `relevance`, `bestseller`)
  - `sortOrder=asc`
  - `page=1&limit=20`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "64f...",
      "name": "iPhone 14 Pro",
      "price": 1899,
      "category": "electronics",
      "brand": "apple",
      "rating": 4.7,
      "stockStatus": "in-stock",
      "tags": ["smartphone", "ios"],
      "attributes": [
        { "name": "color", "value": "black" },
        { "name": "storage", "value": "256gb" }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 125
  }
}
```

### 2.2 Product Detail

- **GET `/products/:productId`** – returns product with brand/owner metadata
- **GET `/products/:productId/variants`** – returns variant list
- **GET `/products/:productId/recommendations?limit=6`** – similar products

### 2.3 Product Mutations (Seller/Admin)

| Action | Method | Endpoint | Body |
| --- | --- | --- | --- |
| Create product | POST | `/products` | `{ "name": "Galaxy S24", "description": "Latest", "price": 1399, "category": "electronics", "brand": "samsung", "imageUrl": [...], "variants": [{"sku": "S24-BLK-128", "price": 1399, "stock": 50, "attributes": {"color": "black", "storage": "128gb"}}] }` |
| Update product | PUT | `/products/:productId` | Partial fields to update |
| Delete product | DELETE | `/products/:productId` | — |

> Requires seller or admin token. Buyers should receive `403 Forbidden` when attempting to mutate products.

### 2.4 Merchandising Feeds (Public)

| Endpoint | Purpose |
| --- | --- |
| `GET /categories` | Category tree with aggregated product counts |
| `GET /brands?category=electronics` | Brands filtered by category |
| `GET /deals` | Active lightning/top offers |
| `GET /bestsellers?category=appliances&limit=8` | Best selling products |
| `GET /recently-viewed` | Auth required; last viewed products for the user |
| `POST /events/view` | `{ "productId": "...", "sessionId": "optional" }` to track a product view |

Expect `202 Accepted` from `POST /events/view` and `401` when missing productId.

---

## 3. Stores (Seller Pages)

| Scenario | Method | Endpoint | Description |
| --- | --- | --- | --- |
| Store overview | GET | `/stores/:sellerId` | Returns seller profile, product count, average rating, total sales/revenue |
| Store catalog | GET | `/stores/:sellerId/products?sort=rating&page=1&limit=12` | Returns paginated product list owned by seller |

If seller ID is invalid or not a seller, expect `404`.

---

## 4. Users & Profiles

| Scenario | Method | Endpoint | Body/Notes |
| --- | --- | --- | --- |
| Get current profile | GET | `/users/me` | Auth required |
| Update profile | PATCH | `/users/profile` | Optional body fields: `firstName`, `lastName`, `bio`, `dateOfBirth`, `locationCity`, `locationCountry`, `educationSchool`, `educationCollege`, `profileImageUrl` |
| Search by username | GET | `/users/search?username=John Doe` | Returns public info |
| Friend suggestions | GET | `/users/suggestions?limit=10` | Matches users with similar location/education/age |

Expect validation errors (`400`) for invalid payloads and `401` for missing tokens.

---

## 5. Recently Viewed & Analytics

1. Authenticate as buyer and fetch a product (`GET /products/:id`).
2. Call `POST /events/view` with the product ID (optionally include `sessionId`).
3. Repeat for multiple products.
4. Call `GET /recently-viewed` with the same token to verify the list (most recent first).

---

## 6. Deals & Bestsellers Validation

- Insert sample deals in the `deals` collection with valid `startsAt`/`endsAt` windows.
- Verify `GET /deals` only returns active deals.
- Place sample orders across multiple products.
- Verify `GET /bestsellers` returns ranked products by quantity sold.

---

## 7. Testing Roles End-to-End

Detailed walkthroughs for customer, seller, and admin flows (registration, login, token usage, catalog access, store management) are documented in `docs/roles-testing.md`.

---

## General Testing Tips

- Base URL: `http://localhost:5000/api`
- Include `Authorization: Bearer <token>` for protected endpoints.
- Use Postman/Insomnia collections to group buyer, seller, and admin calls.
- Verify error cases (invalid IDs, missing fields, unauthorized access) alongside happy paths.
