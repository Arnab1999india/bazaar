import request from "supertest";
import app from "../src/app";
import mongoose from "mongoose";
import { User } from "../src/models/User";

beforeAll(async () => {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/bazaar-test"
  );
});

afterAll(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.connection.close();
});

describe("Auth Module", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "Password123",
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.user.name).toBe("Test User");
  });

  it("should not register a user with an existing email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "Password123",
    });
    expect(res.statusCode).toEqual(409);
    expect(res.body.success).toBe(false);
  });

  it("should login an existing user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "Password123",
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("token");
  });

  it("should not login with incorrect password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@example.com",
      password: "WrongPassword",
    });
    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });
});
