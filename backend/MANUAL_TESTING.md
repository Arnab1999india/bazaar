# Manual Testing Documentation

This document outlines the manual test cases for the Bazaar application.

## Authentication Module

| Test Case ID | Feature           | Test Scenario           | Steps to Reproduce                                                                                                                          | Expected Result                                              | Actual Result                    | Status (Pass/Fail) |
| :----------- | :---------------- | :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------- | :------------------------------- | :----------------- |
| **AUTH-001** | User Registration | Successful Registration | 1. Navigate to the registration endpoint. <br> 2. Provide valid user details (name, email, password). <br> 3. Submit the registration form. | User is created successfully. A success message is returned. | User created and token returned. | Pass               |

| **AUTH-002** | User Registration | Registration with Existing Email | 1. Navigate to the registration endpoint. <br> 2. Provide user details with an email that already exists in the system. <br> 3. Submit the registration form. | An error message is displayed indicating that the email is already in use. | "Email already registered" error returned. | Pass |

| **AUTH-003** | User Login | Successful Login | 1. Navigate to the login endpoint. <br> 2. Provide valid credentials (email and password). <br> 3. Submit the login form. | User is logged in successfully. An authentication token is returned. | User logged in and token returned. | Pass |

| **AUTH-004** | User Login | Login with Incorrect Password | 1. Navigate to the login endpoint. <br> 2. Provide a valid email and an incorrect password. <br> 3. Submit the login form. | An error message is displayed for invalid credentials. | "Invalid email or password" error returned. | Pass |

| **AUTH-005** | User Login | Login with Non-existent User | 1. Navigate to the login endpoint. <br> 2. Provide an email that is not registered. <br> 3. Submit the login form. | An error message is displayed for invalid credentials. | "Invalid email or password" error returned. | Pass |

## Product Module

| Test Case ID | Feature        | Test Scenario               | Steps to Reproduce                                                                                                                                                              | Expected Result                                                     | Actual Result                 | Status (Pass/Fail) |
| :----------- | :------------- | :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------ | :---------------------------- | :----------------- |
| **PROD-001** | Create Product | Successful Product Creation | 1. Log in as an admin/seller. <br> 2. Navigate to the create product endpoint. <br> 3. Provide valid product details (name, description, price, etc.). <br> 4. Submit the form. | The product is created successfully. A success message is returned. | Product created successfully. | Pass               |

| **PROD-002** | View Products | Get All Products | 1. Navigate to the products endpoint. | A list of all products is displayed. | Products retrieved successfully. | Pass |

| **PROD-003** | View Product | Get Product by ID | 1. Navigate to the product details endpoint with a valid product ID. | The details of the specified product are displayed. | | |
| **PROD-004** | Update Product | Successful Product Update | 1. Log in as an admin/seller. <br> 2. Navigate to the update product endpoint with a valid product ID. <br> 3. Modify the product details. <br> 4. Submit the form. | The product is updated successfully. | | |
| **PROD-005** | Delete Product | Successful Product Deletion | 1. Log in as an admin/seller. <br> 2. Navigate to the delete product endpoint with a valid product ID. <br> 3. Confirm deletion. | The product is deleted successfully. | | |

## Review Module

| Test Case ID | Feature       | Test Scenario                 | Steps to Reproduce                                                                                                                  | Expected Result                             | Actual Result | Status (Pass/Fail) |
| :----------- | :------------ | :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------ | :------------ | :----------------- |
| **REV-001**  | Create Review | Successful Review Creation    | 1. Log in as a user. <br> 2. Navigate to a product page. <br> 3. Add a review with a rating and comment. <br> 4. Submit the review. | The review is added to the product.         |               |                    |
| **REV-002**  | View Reviews  | Get All Reviews for a Product | 1. Navigate to a product page.                                                                                                      | All reviews for that product are displayed. |               |                    |

## Cart Module

| Test Case ID | Feature          | Test Scenario              | Steps to Reproduce                                                                               | Expected Result                                   | Actual Result | Status (Pass/Fail) |
| :----------- | :--------------- | :------------------------- | :----------------------------------------------------------------------------------------------- | :------------------------------------------------ | :------------ | :----------------- |
| **CART-001** | Add to Cart      | Add a Product to Cart      | 1. Log in as a user. <br> 2. Navigate to a product page. <br> 3. Click the "Add to Cart" button. | The product is added to the user's shopping cart. |               |                    |
| **CART-002** | View Cart        | View Cart Contents         | 1. Log in as a user. <br> 2. Navigate to the cart page.                                          | The contents of the shopping cart are displayed.  |               |                    |
| **CART-003** | Remove from Cart | Remove a Product from Cart | 1. Log in as a user. <br> 2. Navigate to the cart page. <br> 3. Remove a product from the cart.  | The product is removed from the shopping cart.    |               |                    |

## Order Module

| Test Case ID  | Feature      | Test Scenario             | Steps to Reproduce                                                                                                                                          | Expected Result                                                        | Actual Result | Status (Pass/Fail) |
| :------------ | :----------- | :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- | :------------ | :----------------- |
| **ORDER-001** | Create Order | Successful Order Creation | 1. Log in as a user. <br> 2. Add items to the cart. <br> 3. Proceed to checkout. <br> 4. Provide shipping and payment information. <br> 5. Place the order. | The order is created successfully. An order confirmation is displayed. |               |                    |
| **ORDER-002** | View Order   | Get Order Details         | 1. Log in as a user. <br> 2. Navigate to the order history page. <br> 3. Select an order to view its details.                                               | The details of the specified order are displayed.                      |               |                    |
