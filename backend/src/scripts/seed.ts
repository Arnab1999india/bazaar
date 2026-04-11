import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";

// Load Environment
const envPathFromRoot = path.resolve(process.cwd(), ".env");
const envPathFromBackend = path.resolve(process.cwd(), "backend", ".env");
const resolvedEnvPath = fs.existsSync(envPathFromRoot)
  ? envPathFromRoot
  : envPathFromBackend;
dotenv.config({ path: resolvedEnvPath });

// Import Your Models
import { User } from "../models/User";
import { Product } from "../models/Product";
import { Category } from "../models/Category";
import { Review } from "../models/Review";
import { SellerProfile } from "../models/SellerProfile";
import { UserRole } from "../interfaces/user.interface";

async function seedBazaar() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI is not set in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB...");

    // 1. CLEANUP (Optional: Remove if you don't want to wipe the DB every time)
    console.log("Cleaning existing data...");
    await Promise.all([
      User.deleteMany({ email: { $ne: "adminTest@bazaar.com" } }), // Keep your main admin if you want
      Product.deleteMany({}),
      Category.deleteMany({}),
      Review.deleteMany({}),
      SellerProfile.deleteMany({}),
    ]);

    // 2. CREATE CATEGORIES
    const categoryNames = [
      "Electronics",
      "Groceries",
      "Home & Kitchen",
      "Fashion",
      "Stationery",
    ];
    const createdCategories = [];
    for (const name of categoryNames) {
      const cat = await Category.create({
        name,
        slug: name.toLowerCase().replace(/ /g, "-"),
      });
      createdCategories.push(cat);
    }
    console.log(`✅ Created ${createdCategories.length} categories.`);

    // 3. CREATE USERS (Admin, 3 Sellers, 6 Customers)
    const users = [];

    // Ensure Super Admin exists (Your previous logic)
    const adminEmail = "adminTest@bazaar.com";
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: "Super Admin",
        email: adminEmail,
        password: "Admin@123",
        role: UserRole.ADMIN,
        isVerified: true,
      });
    }
    users.push(admin);

    // Create 3 Sellers
    for (let i = 1; i <= 3; i++) {
      const seller = await User.create({
        name: faker.person.fullName(),
        email: `seller${i}@bazaar.com`,
        password: "Password@123",
        role: UserRole.SELLER,
        isVerified: true,
      });

      await SellerProfile.create({
        user: seller._id,
        businessName: `${seller.name}'s Shop`,
        businessType: "Retail",
        phone: "9876543210",
        shopAddress: {
          line1: faker.location.streetAddress(),
          city: "Durgapur",
          state: "West Bengal",
          country: "India",
          postalCode: "713206",
        },
        status: "approved",
      });
      users.push(seller);
    }

    // Create 6 Customers
    for (let i = 1; i <= 6; i++) {
      const customer = await User.create({
        name: faker.person.fullName(),
        email: `user${i}@test.com`,
        password: "Password@123",
        role: UserRole.CUSTOMER,
        isVerified: true,
      });
      users.push(customer);
    }
    console.log("✅ Created Sellers, SellerProfiles, and Customers.");

    // 4. CREATE 250 PRODUCTS
    const sellers = users.filter((u) => u.role === UserRole.SELLER);
    const customers = users.filter((u) => u.role === UserRole.CUSTOMER);
    const products = [];

    console.log("Generating 250 products...");
    for (let i = 0; i < 250; i++) {
      const randomCategory = faker.helpers.arrayElement(createdCategories);
      const randomSeller = faker.helpers.arrayElement(sellers);

      const product = await Product.create({
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price({ min: 50, max: 2000 })),
        category: randomCategory.name,
        categoryPath: [randomCategory.name],
        owner: (randomSeller as any)._id.toString(),
        imageUrl: [faker.image.urlLoremFlickr({ category: "technics" })],
        totalStock: faker.number.int({ min: 5, max: 50 }),
        stockStatus: "in-stock",
        attributes: [{ name: "Condition", value: "New" }],
      });
      products.push(product);
    }

    // 5. CREATE RANDOM REVIEWS (with actual rating updates)
    console.log("Seeding reviews and calculating ratings...");
    for (const prod of products) {
      // Each product gets 1-3 reviews
      const reviewCount = faker.number.int({ min: 1, max: 3 });
      const reviewers = faker.helpers.arrayElements(customers, reviewCount);

      for (const reviewer of reviewers) {
        await Review.create({
          product: (prod as any)._id.toString(),
          user: (reviewer as any)._id.toString(),
          rating: faker.number.int({ min: 3, max: 5 }),
          comment: faker.lorem.sentence(),
        });
      }
    }

    console.log("\n🚀 SEEDING COMPLETE!");
    console.log(`Total Products: 250`);
    console.log(`Test Login: seller1@bazaar.com / Password@123`);

    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seedBazaar();
