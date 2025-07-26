import request from "supertest";
import app from "../src/app";
import mongoose from "mongoose";
import { User } from "../src/models/User";
import { Product } from "../src/models/Product";
import { IUser } from "../src/interfaces/user.interface";

let token: string;
let userId: string;

beforeAll(async () => {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/bazaar-test"
  );
  const user = await User.create({
    name: "Test User",
    email: "product-test@example.com",
    password: "Password123",
  });
  userId = (user as any)._id.toString();
  const res = await request(app).post("/api/auth/login").send({
    email: "product-test@example.com",
    password: "Password123",
  });
  token = res.body.data.token;
});

afterAll(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.connection.close();
});

describe("Product Module", () => {
  let productId: string;

  it("should create a new product", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Product",
        description: "Test Description",
        price: 100,
        category: "Test Category",
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Test Product");
    productId = res.body.data._id;
  });

  it("should get all products", async () => {
    const res = await request(app).get("/api/products");
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  it("should get a product by id", async () => {
    const res = await request(app).get(`/api/products/${productId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Test Product");
  });

  it("should update a product", async () => {
    const res = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Test Product",
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Updated Test Product");
  });

  it("should delete a product", async () => {
    const res = await request(app)
      .delete(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});
