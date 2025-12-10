# Role-Based Manual Testing Guide

This guide walks through end-to-end testing flows for each role (buyer, seller, admin) using the new catalog, store, and analytics endpoints. It assumes the backend is running locally at `http://localhost:5000` and MongoDB is accessible.

> **Tip:** Use Postman/Insomnia collections and environment variables for base URL and tokens. All protected calls require an `Authorization: Bearer <token>` header.

---

## 1. Prerequisites

1. Run MongoDB and start the backend (`npm run dev`).
2. Ensure `.env` contains valid `MONGO_URI` and `JWT_SECRET`.
3. Optionally seed sample categories, brands, products, and deals (either manually or via Mongo shell).

---

## 2. Buyer Flow

1. **Register buyer**  
   `POST /api/auth/register` with body `{ "name": "Buyer One", "email": "buyer@example.com", "password": "Password123" }`.

2. **Verify email (optional)**  
   If OTP verification is enabled, complete the OTP flow; otherwise proceed.

3. **Login**  
   `POST /api/auth/login` and capture the JWT token from the response.

4. **Browse catalog**

   - `GET /api/categories` � confirm product counts per category.
   - `GET /api/brands?category=electronics` � verify brand filtering.
   - `GET /api/products?q=laptop&attributes[color]=black&inStock=true` � validate advanced filters and pagination metadata.

5. **Explore product detail**

   - `GET /api/products/:productId`
   - `GET /api/products/:productId/variants`
   - `GET /api/products/:productId/recommendations`

6. **Track product views**

   - `POST /api/events/view` body `{ "productId": "<id>" }`
   - Repeat for multiple products.
   - `GET /api/recently-viewed` � ensure the response reflects the recorded events in reverse-chronological order.

7. **Check merchandising feeds**

   - `GET /api/deals` � verify active deals
   - `GET /api/bestsellers?category=electronics` � confirm ordering by sales

8. **Update profile & suggestions**
   - `PATCH /api/users/profile` body `{ "locationCity": "Berlin", "educationCollege": "ABC University" }`
   - `GET /api/users/suggestions?limit=5` � ensure users with shared attributes are returned.

---

## 3. Seller Flow

1. **Create seller account**

   - Register a new user with name/email/password.
   - Update their role to `seller`. This can be done either via an admin API (if available) or by updating the user document in MongoDB/DBeaver: set `role: "seller"` and optionally add store metadata (bio, location, etc.).

2. **Login as seller**  
   Obtain a token using `POST /api/auth/login`.

3. **Create catalog entries**

   - `POST /api/products` with variants, attributes, tags, etc.
   - Repeat for several products across different categories.

4. **Update existing products**

   - `PUT /api/products/:productId` to adjust pricing or stock.
   - `DELETE /api/products/:productId` to verify ownership enforcement (`404`/`403` when attempting to modify another seller�s product).

5. **View store page**

   - `GET /api/stores/:sellerId` � confirm aggregated stats (product count, rating, sales/revenue).
   - `GET /api/stores/:sellerId/products?sort=rating&page=1` � validate pagination and sorting.

6. **Cross-check analytics**  
   Place sample orders (as buyer) and ensure the totals reflected in the seller overview change accordingly.

---

## 4. Admin Flow

1. **Login as admin**  
   Use an existing admin user or update a user�s `role` to `admin` directly in the database.

2. **Audit catalog**

   - `GET /api/categories`, `/api/brands`, `/api/deals`, `/api/bestsellers`.
   - Verify all endpoints succeed without authentication errors; admin tokens should have full access.

3. **Manage users/sellers**

   - `GET /api/users/me` to confirm admin context.
   - Update seller profiles via `PATCH /api/users/profile` (using their credentials) or edit directly in the database.

4. **Database verification (DBeaver/Mongo shell)**
   - Connect to MongoDB using the connection string from `.env`.
   - Inspect collections: `users`, `products`, `categories`, `brands`, `deals`, `productviews`, `orders`.
   - Use DBeaver�s data grid to confirm new records after each API call (e.g., product creation, view event, order placement).

---

## 5. Suggested Testing Order

1. Register/login all roles, capture tokens in your API client.
2. Seed categories/brands if the database is empty.
3. Create products as seller(s).
4. Browse and interact as buyer to populate views, reviews, orders.
5. Inspect store and catalog analytics as admin.
6. Validate that unauthorized actions return `401/403` (e.g., buyer attempting to create a product).

---

## 6. Troubleshooting Tips

- Ensure the JWT token matches the intended role; repeat login if in doubt.
- For attribute filtering, double-check that products contain matching `attributes` in the database.
- Deals and bestsellers rely on data: seed a few deals and place orders to generate meaningful results.
- Use `npm run build` to catch TypeScript issues before deploying changes.

---

By following the steps above you can validate the catalog, store, analytics, and profile features end-to-end for buyers, sellers, and admins.
