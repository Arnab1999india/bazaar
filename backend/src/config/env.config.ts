import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { AppError, ErrorType } from "../interfaces/error.interface";

// Load environment variables
const envPathFromRoot = path.resolve(process.cwd(), ".env");
const envPathFromBackend = path.resolve(process.cwd(), "backend", ".env");
const resolvedEnvPath = process.env.DOTENV_PATH
  ? process.env.DOTENV_PATH
  : fs.existsSync(envPathFromRoot)
  ? envPathFromRoot
  : envPathFromBackend;
dotenv.config({ path: resolvedEnvPath });

interface IEnvConfig {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  MONGO_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string | number;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  CLIENT_URL: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
}

const getConfig = (): IEnvConfig => {
  const config: Record<keyof IEnvConfig, string | undefined> = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CLIENT_URL: process.env.CLIENT_URL,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  };

  // Validate required environment variables
  const requiredEnvVars: (keyof IEnvConfig)[] = [
    "NODE_ENV",
    "PORT",
    "MONGO_URI",
    "JWT_SECRET",
    "JWT_EXPIRES_IN",
  ];

  const missingEnvVars = requiredEnvVars.filter((envVar) => !config[envVar]);

  if (missingEnvVars.length > 0) {
    throw new AppError(
      ErrorType.INTERNAL,
      `Missing required environment variables: ${missingEnvVars.join(", ")}`,
      500
    );
  }

  return {
    NODE_ENV: (config.NODE_ENV as IEnvConfig["NODE_ENV"]) || "development",
    PORT: parseInt(config.PORT as string, 10) || 5000,
    MONGO_URI: config.MONGO_URI as string,
    JWT_SECRET: config.JWT_SECRET as string,
    JWT_EXPIRES_IN: config.JWT_EXPIRES_IN || "7d",
    GOOGLE_CLIENT_ID: config.GOOGLE_CLIENT_ID as string,
    GOOGLE_CLIENT_SECRET: config.GOOGLE_CLIENT_SECRET as string,
    SMTP_HOST: config.SMTP_HOST as string,
    SMTP_PORT: parseInt(config.SMTP_PORT as string, 10) || 587,
    SMTP_USER: config.SMTP_USER as string,
    SMTP_PASS: config.SMTP_PASS as string,
    CLOUDINARY_CLOUD_NAME: config.CLOUDINARY_CLOUD_NAME as string,
    CLOUDINARY_API_KEY: config.CLOUDINARY_API_KEY as string,
    CLOUDINARY_API_SECRET: config.CLOUDINARY_API_SECRET as string,
    CLIENT_URL: (config.CLIENT_URL as string) || "http://localhost:3000",
    RAZORPAY_KEY_ID: config.RAZORPAY_KEY_ID as string | undefined,
    RAZORPAY_KEY_SECRET: config.RAZORPAY_KEY_SECRET as string | undefined,
    RAZORPAY_WEBHOOK_SECRET: config.RAZORPAY_WEBHOOK_SECRET as string | undefined,
  };
};

export const envConfig: IEnvConfig = getConfig();
