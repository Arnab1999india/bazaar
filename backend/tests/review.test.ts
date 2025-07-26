import request from "supertest";
import app from "../src/app";
import mongoose from "mongoose";
import { User } from "../src/models/User";
import { Product } from "../src/models/Product";
import { Review } from "../src/models/Review";

let token: string;
let userId: string;
let productId: string;

beforeAll(async () => {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/bazaar-test"
  );
  const user = await User.create({
    name: "Test User",
    email: "review-test@example.com",
    password: "Password123",
  });
  userId = (user as any)._id.toString();
  const res = await request(app).post("/api/auth/login").send({
    email: "review-test@example.com",
    password: "Password123",
  });
  token = res.body.data.token;
  const product = await Product.create({
    name: "Test Product",
    description: "Test Description",
    price: 100,
    category: "Test Category",
    owner: userId,
  });
  productId = (product as any)._id.toString();
});

afterAll(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.connection.close();
});

describe("Review Module", () => {
  let reviewId: string;

  it("should create a new review", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${token}`)
      .send({
        product: productId,
        rating: 5,
        comment: "Great product!",
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comment).toBe("Great product!");
    reviewId = res.body.data._id;
  });

  it("should get all reviews for a product", async () => {
    const res = await request(app).get(`/api/reviews/product/${productId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  it("should update a review", async () => {
    const res = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        comment: "Updated comment",
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comment).toBe("Updated comment");
  });

  it("should delete a review", async () => {
    const res = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});
