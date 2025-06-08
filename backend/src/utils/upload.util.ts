import { v2 as cloudinary } from "cloudinary";
import { envConfig } from "../config/env.config";
import { AppError, ErrorType } from "../interfaces/error.interface";
import { ValidationUtil } from "./validation.util";

// Configure cloudinary
cloudinary.config({
  cloud_name: envConfig.CLOUDINARY_CLOUD_NAME,
  api_key: envConfig.CLOUDINARY_API_KEY,
  api_secret: envConfig.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
}

export class UploadUtil {
  private static readonly ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"];
  private static readonly MAX_FILE_SIZE_MB = 5;

  static async uploadImage(
    file: Express.Multer.File,
    folder: string = "products"
  ): Promise<UploadResult> {
    try {
      // Validate file type
      const format = file.mimetype.split("/")[1];
      if (!this.ALLOWED_FORMATS.includes(format)) {
        throw new AppError(
          ErrorType.VALIDATION,
          `Invalid file format. Allowed formats: ${this.ALLOWED_FORMATS.join(
            ", "
          )}`,
          400
        );
      }

      // Validate file size
      if (!ValidationUtil.validateImageSize(file.size, this.MAX_FILE_SIZE_MB)) {
        throw new AppError(
          ErrorType.VALIDATION,
          `File size must not exceed ${this.MAX_FILE_SIZE_MB}MB`,
          400
        );
      }

      // Upload to cloudinary
      const result = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: "auto",
        allowed_formats: this.ALLOWED_FORMATS,
        transformation: [
          { width: 1000, height: 1000, crop: "limit" }, // Limit max dimensions
          { quality: "auto:good" }, // Optimize quality
        ],
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error uploading image", 500);
    }
  }

  static async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = "products"
  ): Promise<UploadResult[]> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadImage(file, folder)
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorType.INTERNAL,
        "Error uploading multiple images",
        500
      );
    }
  }

  static async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new AppError(ErrorType.INTERNAL, "Error deleting image", 500);
    }
  }

  static async deleteMultipleImages(publicIds: string[]): Promise<void> {
    try {
      const deletePromises = publicIds.map((publicId) =>
        this.deleteImage(publicId)
      );
      await Promise.all(deletePromises);
    } catch (error) {
      throw new AppError(
        ErrorType.INTERNAL,
        "Error deleting multiple images",
        500
      );
    }
  }

  static getPublicIdFromUrl(url: string): string {
    try {
      const splitUrl = url.split("/");
      const filename = splitUrl[splitUrl.length - 1];
      const publicId = filename.split(".")[0];
      return publicId;
    } catch (error) {
      throw new AppError(ErrorType.VALIDATION, "Invalid image URL", 400);
    }
  }
}
