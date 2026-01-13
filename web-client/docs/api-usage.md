## API Usage Map

- `src/app/features/auth/login/login.component.ts`: `POST /auth/login` (AuthService.login) – stores JWT, navigates home.
- `src/app/features/auth/register/register.component.ts`: `POST /auth/register` (AuthService.register) – creates account then routes to login.

### Available service calls (ready to wire into pages)
- AuthService: `POST /auth/refresh`, `POST /auth/logout` (with Authorization header).
- CatalogService: `GET /products`, `GET /products/:productId`, `GET /products/:productId/variants`, `GET /products/:productId/recommendations`, `POST/PUT/DELETE /products` (seller/admin protected).
- MerchandisingService: `GET /categories`, `GET /brands?category=...`, `GET /deals`, `GET /bestsellers`, `GET /recently-viewed` (auth), `POST /events/view` (auth).
- StoreService: `GET /stores/:sellerId`, `GET /stores/:sellerId/products`.
- UserService: `GET /users/me`, `PATCH /users/profile`, `GET /users/search?username=...`, `GET /users/suggestions?limit=...`.
