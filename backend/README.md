# E-commerce Backend API

A TypeScript-based Node.js/Express backend for an e-commerce platform backed by MongoDB.

## Features

- Authentication & authorization (JWT, Google OAuth)
- Rich product catalog with text search, filtering, sorting, variants, and recommendations
- Dynamic category tree, brand directory, lightning deals, and best-seller feeds
- Recently viewed tracking and product view analytics
- Shopping cart, wishlists, orders, reviews, and ratings
- Seller store pages with aggregated metrics
- User profile management with friend suggestions based on shared attributes
- Email notifications, OTP workflows, Cloudinary image uploads, and Swagger docs
- Input validation, rate limiting, and automated tests

## Prerequisites

- Node.js (v16 or higher recommended)
- MongoDB instance
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` file with your configuration (MongoDB URI, JWT secret, etc.)

## Development

Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:5000` by default.

## Scripts

- `npm start` – start the production server
- `npm run dev` – start the development server with hot reload
- `npm run build` – compile TypeScript to JavaScript
- `npm run watch` – watch for TypeScript changes
- `npm test` – run unit/integration tests
- `npm run test:watch` – run tests in watch mode
- `npm run test:coverage` – run tests with coverage report
- `npm run lint` – run ESLint
- `npm run lint:fix` – auto-fix lint issues
- `npm run clean` – remove build artifacts
- `npm run build:clean` – clean and rebuild the project
- `npm run start:prod` – run the compiled production server

## Project Structure

```
src/
+-- config/        # Configuration helpers
+-- controllers/   # Express route controllers
+-- interfaces/    # TypeScript interfaces & DTOs
+-- middlewares/   # Authentication & utility middleware
+-- models/        # Mongoose models
+-- routes/        # Route definitions
+-- services/      # Business logic layer
+-- utils/         # Shared utilities
+-- app.ts         # Express application setup
+-- index.ts       # Application entry point
```

## API Highlights

- `GET /api/categories` – category tree with product counts
- `GET /api/brands` – brand directory (filterable by category)
- `GET /api/products` – catalog browse/search with advanced filters
- `GET /api/products/:id/variants` & `/recommendations` – product detail enrichments
- `GET /api/deals`, `/api/bestsellers`, `/api/recently-viewed` – merchandising feeds
- `POST /api/events/view` – track product impressions
- `GET /api/stores/:sellerId` – seller store overview & product listing
- `PATCH /api/users/profile`, `GET /api/users/suggestions` – profile management & discovery

Swagger documentation is available at `/api-docs` once the server is running.

## Testing

Run the automated test suite:

```bash
npm test
```

Generate a coverage report:

```bash
npm run test:coverage
```

Manual testing flows for buyers, sellers, and admins are documented in `docs/roles-testing.md`.

## Production

Build the project:

```bash
npm run build
```

Start the compiled server:

```bash
npm run start:prod
```

## Environment Variables

Consult `.env.example` for the full list of required environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your fork
5. Open a pull request

## License

This project is licensed under the MIT License.
