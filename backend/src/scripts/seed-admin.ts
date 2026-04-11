/**
 * Seed Script: Create initial super-admin account
 *
 * Usage:
 *   npx ts-node src/scripts/seed-admin.ts
 *
 * This creates the default admin with:
 *   Email:    adminTest@bazaar.com
 *   Password: Admin@123
 *
 * Run once on a fresh database. Idempotent — skips if admin already exists.
 */
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

const envPathFromRoot = path.resolve(process.cwd(), ".env");
const envPathFromBackend = path.resolve(process.cwd(), "backend", ".env");
const resolvedEnvPath = fs.existsSync(envPathFromRoot)
  ? envPathFromRoot
  : envPathFromBackend;
dotenv.config({ path: resolvedEnvPath });

import mongoose from "mongoose";
import { User } from "../models/User";
import { UserRole } from "../interfaces/user.interface";

async function seedAdmin() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is not set in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const adminEmail = "adminTest@bazaar.com";
  const existing = await User.findOne({ email: adminEmail });

  if (existing) {
    console.log(`Admin already exists: ${adminEmail}`);
    await mongoose.disconnect();
    return;
  }

  await User.create({
    name: "Super Admin",
    email: adminEmail,
    password: "Admin@123",
    role: UserRole.ADMIN,
    isVerified: true,
  });

  console.log("✅ Super admin created:");
  console.log("   Email:    adminTest@bazaar.com");
  console.log("   Password: Admin@123");
  console.log("\nIMPORTANT: Change the password after first login!");

  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
