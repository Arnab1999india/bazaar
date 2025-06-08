# E-commerce Backend API

A TypeScript-based Node.js/Express backend for an e-commerce platform with MongoDB.

## Features

- 🔐 Authentication & Authorization (JWT, Google OAuth)
- 🛍️ Product Management
- 🛒 Shopping Cart & Wishlist
- 📦 Order Management
- ⭐ Product Reviews & Ratings
- 👥 User Management
- 📧 Email Notifications
- 🖼️ Image Upload (Cloudinary)
- 📝 API Documentation (Swagger)
- ✅ Input Validation
- 🔒 Rate Limiting
- 🧪 Unit & Integration Tests

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` file with your configuration

## Development

Start the development server:

```bash
npm run dev
```

## Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot-reload
- `npm run build` - Build the TypeScript code
- `npm run watch` - Watch for TypeScript changes
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run clean` - Remove build directory
- `npm run build:clean` - Clean and rebuild
- `npm run start:prod` - Start production server

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── interfaces/     # TypeScript interfaces
├── middlewares/    # Custom middlewares
├── models/         # Mongoose models
├── routes/         # API routes
├── services/       # Business logic
├── utils/         # Utility functions
├── app.ts         # Express app setup
└── index.ts       # Entry point
```

## API Documentation

Once the server is running, visit `/api-docs` for the Swagger documentation.

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Production

Build the project:

```bash
npm run build
```

Start the production server:

```bash
npm run start:prod
```

## Environment Variables

See `.env.example` for all required environment variables.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.
