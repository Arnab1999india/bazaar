# Backend API Test Cases

## 1. Authentication Module

### 1.1 User Registration

- **Method:** POST
- **URL:** /api/v1/auth/register
- **Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "role": "customer"
}
```

- **Success Response:**
  - Status: 200 OK
  - Body:
  ```json
  {
    "token": "jwt-token-string",
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    }
  }
  ```
- **Error Responses:**
  - 409 Conflict: Email already registered
  - 400 Bad Request: Missing or invalid fields
  - 500 Internal Server Error: Server error

### 1.2 User Login

- **Method:** POST
- **URL:** /api/v1/auth/login
- **Request Body:**

```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

- **Success Response:**
  - Status: 200 OK
  - Body:
  ```json
  {
    "token": "jwt-token-string",
    "user": {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    }
  }
  ```
- **Error Responses:**
  - 401 Unauthorized: Invalid email or password
  - 400 Bad Request: Missing or invalid fields
  - 500 Internal Server Error: Server error

### 1.3 Google OAuth Login (Simulated)

- **Method:** POST
- **URL:** /api/v1/auth/google
- **Request Body:**

```json
{
  "id": "google-id-123",
  "displayName": "John Google",
  "emails": [{ "value": "john.google@example.com" }]
}
```

- **Success Response:** Same as login
- **Error Responses:** 500 Internal Server Error

### 1.4 Change Password

- **Method:** POST
- **URL:** /api/v1/auth/change-password
- **Headers:** Authorization: Bearer &lt;token&gt;
- **Request Body:**

```json
{
  "currentPassword": "Password123",
  "newPassword": "NewPassword456"
}
```

- **Success Response:**
  - Status: 200 OK
  - Body:
  ```json
  {
    "message": "Password changed successfully"
  }
  ```
- **Error Responses:**
  - 401 Unauthorized: Current password incorrect
  - 404 Not Found: User not found
  - 400 Bad Request: Missing fields
  - 500 Internal Server Error

### 1.5 Password Reset Request

- **Method:** POST
- **URL:** /api/v1/auth/reset-password-request
- **Request Body:**

```json
{
  "email": "john@example.com"
}
```

- **Success Response:**
  - Status: 200 OK
  - Body:
  ```json
  {
    "message": "Password reset instructions sent"
  }
  ```
- **Error Responses:**
  - 404 Not Found: No account with this email
  - 400 Bad Request: Missing or invalid email
  - 500 Internal Server Error

---

## 2. Product Module

### 2.1 Create Product

- **Method:** POST
- **URL:** /api/v1/products
- **Headers:** Authorization: Bearer &lt;token&gt;
- **Request Body:**

```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "category": "electronics",
  "imageUrl": ["https://example.com/image1.jpg"],
  "stockStatus": "in-stock"
}
```

- **Success Response:**
  - Status: 201 Created
  - Body:
  ```json
  {
    "id": "product-id",
    "name": "Product Name",
    "description": "Product description",
    "price": 99.99,
    "category": "electronics",
    "imageUrl": ["https://example.com/image1.jpg"],
    "stockStatus": "in-stock",
    "owner": "user-id",
    "rating": 0,
    "reviews": [],
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
  ```
- **Error Responses:**
  - 400 Bad Request: Missing or invalid fields
  - 401 Unauthorized: Missing or invalid token
  - 500 Internal Server Error

### 2.2 Get Products (List with Filters)

- **Method:** GET
- **URL:** /api/v1/products?search=phone&category=electronics&minPrice=50&maxPrice=500&stockStatus=in-stock&sortBy=price&sortOrder=asc&page=1&limit=10
- **Success Response:**
  - Status: 200 OK
  - Body:
  ```json
  {
    "products": [
      /* array of product objects */
    ],
    "total": 100
  }
  ```
- **Error Responses:**
  - 400 Bad Request: Invalid query parameters
  - 500 Internal Server Error

### 2.3 Get Product by ID

- **Method:** GET
- **URL:** /api/v1/products/:id
- **Success Response:**
  - Status: 200 OK
  - Body: Product object
- **Error Responses:**
  - 404 Not Found: Product not found
  - 400 Bad Request: Invalid product ID
  - 500 Internal Server Error

### 2.4 Update Product

- **Method:** PUT
- **URL:** /api/v1/products/:id
- **Headers:** Authorization: Bearer &lt;token&gt;
- **Request Body:** Partial product fields to update
- **Success Response:**
  - Status: 200 OK
  - Body: Updated product object
- **Error Responses:**
  - 404 Not Found: Product not found or no permission
  - 400 Bad Request: Invalid fields
  - 401 Unauthorized: Missing or invalid token
  - 500 Internal Server Error

### 2.5 Delete Product

- **Method:** DELETE
- **URL:** /api/v1/products/:id
- **Headers:** Authorization: Bearer &lt;token&gt;
- **Success Response:**
  - Status: 204 No Content
- **Error Responses:**
  - 404 Not Found: Product not found or no permission
  - 401 Unauthorized: Missing or invalid token
  - 500 Internal Server Error

---

## 3. Utilities and Other Modules

- Response formatting utilities standardize success and error responses.
- Validation utilities ensure data integrity for emails, passwords, phone numbers, prices, and product inputs.
- Upload utilities handle image uploads to Cloudinary with validation and optimization.

---

## How to Test

- Use Postman or similar API testing tools.
- Set the base URL to your backend server (e.g., http://localhost:5000).
- For protected routes, include the Authorization header with a valid JWT token:  
  `Authorization: Bearer <token>`
- Test both success and error cases by sending valid and invalid data.
- Check response status codes and response body for expected results.

---

This file documents all the test cases for backend modules in detail for easy reference and testing.
