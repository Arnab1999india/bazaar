import dotenv from "dotenv";
import { AppError, ErrorType } from "../interfaces/error.interface";

// Load environment variables
dotenv.config();

interface IEnvConfig {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  MONGODB_URI: string;
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
}

const getConfig = (): IEnvConfig => {
  const config: Record<keyof IEnvConfig, string | undefined> = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    MONGODB_URI: process.env.MONGODB_URI,
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
  };

  // Validate required environment variables
  const requiredEnvVars: (keyof IEnvConfig)[] = [
    "NODE_ENV",
    "PORT",
    "MONGODB_URI",
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
    MONGODB_URI: config.MONGODB_URI as string,
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
  };
};

export const envConfig: IEnvConfig = getConfig();
