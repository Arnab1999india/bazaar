import mongoose from "mongoose";
import { envConfig } from "./env.config";
import { AppError, ErrorType } from "../interfaces/error.interface";

export const connectDatabase = async (): Promise<void> => {
  try {
    const options = {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(envConfig.MONGO_URI, options);

    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      throw new AppError(ErrorType.INTERNAL, "Database connection error", 500);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    // Handle application termination
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        console.log("MongoDB connection closed through app termination");
        process.exit(0);
      } catch (err) {
        console.error("Error closing MongoDB connection:", err);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("Database connection error:", error);
    throw new AppError(
      ErrorType.INTERNAL,
      "Failed to connect to database",
      500
    );
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error closing database connection:", error);
    throw new AppError(
      ErrorType.INTERNAL,
      "Failed to close database connection",
      500
    );
  }
};
