# High-Level Design (HLD)

## 1. Introduction

This document outlines the high-level architecture of the Bazaar e-commerce backend API. The system is designed to be a scalable, secure, and maintainable platform for an online marketplace.

## 2. System Architecture

The system follows a classic three-tier architecture:

- **Presentation Tier (Client):** A web or mobile application that interacts with the API.
- **Application Tier (Backend):** The Node.js/Express API that handles business logic.
- **Data Tier (Database):** A MongoDB database for data persistence.

The backend is built using a modular, service-oriented architecture. Each module (e.g., Auth, Product, Order) is self-contained and exposes a set of services and API endpoints.

```
[Client] <--> [API Gateway] <--> [Backend API] <--> [MongoDB]
```

## 3. Core Modules

### 3.1. Authentication Module

- **Responsibilities:** User registration, login, password management, and JWT-based authentication.
- **Technologies:** bcrypt for password hashing, JWT for token generation, Passport.js for Google OAuth.
- **Endpoints:** `/api/auth/register`, `/api/auth/login`, `/api/auth/google`, etc.

### 3.2. User Module

- **Responsibilities:** Manages user profiles, roles, and permissions.
- **Technologies:** Mongoose for data modeling.
- **Endpoints:** `/api/users/profile`, `/api/users/:id`, etc.

### 3.3. Product Module

- **Responsibilities:** Manages product catalog, including creation, retrieval, updates, and deletion.
- **Technologies:** Mongoose for data modeling, Cloudinary for image uploads.
- **Endpoints:** `/api/products`, `/api/products/:id`, etc.

### 3.4. Cart Module

- **Responsibilities:** Manages shopping carts for users.
- **Technologies:** Mongoose for data modeling.
- **Endpoints:** `/api/cart`, `/api/cart/add`, etc.

### 3.5. Order Module

- **Responsibilities:** Manages customer orders, including creation, status updates, and retrieval.
- **Technologies:** Mongoose for data modeling.
- **Endpoints:** `/api/orders`, `/api/orders/:id`, etc.

### 3.6. Review Module

- **Responsibilities:** Manages product reviews and ratings.
- **Technologies:** Mongoose for data modeling.
- **Endpoints:** `/api/reviews`, `/api/reviews/product/:productId`, etc.

## 4. Technology Stack

- **Backend:** Node.js, Express.js, TypeScript
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT, Passport.js (Google OAuth)
- **Image Storage:** Cloudinary
- **Email:** Nodemailer
- **Testing:** Jest, Supertest

## 5. Deployment

The application is designed to be deployed on a cloud platform like Heroku, AWS, or Google Cloud. It can also be containerized using Docker for easy deployment and scaling.
