import { OTP } from "../models/OTP";
import { EmailService } from "./email.service";
import {
  IOTPInput,
  IOTPVerifyInput,
  IOTPResponse,
} from "../interfaces/otp.interface";
import { AppError, ErrorType } from "../interfaces/error.interface";

export class OTPService {
  static async generateAndSendOTP(data: IOTPInput): Promise<IOTPResponse> {
    try {
      // Generate OTP
      const otpDoc = await OTP.generateOTP(data.email, data.purpose);

      // Send OTP via email
      await EmailService.sendOTPEmail(data.email, otpDoc.otp, data.purpose);

      return {
        message: "OTP sent successfully to your email",
        expiresIn: 10, // 10 minutes
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorType.INTERNAL,
        "Failed to generate and send OTP",
        500
      );
    }
  }

  static async verifyOTP(data: IOTPVerifyInput): Promise<boolean> {
    try {
      // Find valid OTP
      const otpDoc = await OTP.findValidOTP(data.email, data.purpose);

      if (!otpDoc) {
        throw new AppError(ErrorType.VALIDATION, "Invalid or expired OTP", 400);
      }

      // Verify OTP
      if (!otpDoc.verifyOTP(data.otp)) {
        throw new AppError(ErrorType.VALIDATION, "Invalid OTP", 400);
      }

      // Mark OTP as verified
      otpDoc.verified = true;
      await otpDoc.save();

      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Failed to verify OTP", 500);
    }
  }

  static async resendOTP(data: IOTPInput): Promise<IOTPResponse> {
    try {
      // Check if there's a recent OTP (within 1 minute)
      const recentOTP = await OTP.findOne({
        email: data.email,
        purpose: data.purpose,
        createdAt: { $gte: new Date(Date.now() - 60 * 1000) }, // 1 minute ago
      });

      if (recentOTP) {
        throw new AppError(
          ErrorType.VALIDATION,
          "Please wait before requesting a new OTP",
          429
        );
      }

      // Generate and send new OTP
      return await this.generateAndSendOTP(data);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Failed to resend OTP", 500);
    }
  }

  static async isOTPVerified(
    email: string,
    purpose: "registration" | "password-reset"
  ): Promise<boolean> {
    try {
      const verifiedOTP = await OTP.findOne({
        email,
        purpose,
        verified: true,
        createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // Valid for 30 minutes after verification
      });

      return !!verifiedOTP;
    } catch (error) {
      return false;
    }
  }

  static async cleanupExpiredOTPs(): Promise<void> {
    try {
      await OTP.cleanupExpiredOTPs();
    } catch (error) {
      console.error("Failed to cleanup expired OTPs:", error);
    }
  }

  static async deleteVerifiedOTP(
    email: string,
    purpose: "registration" | "password-reset"
  ): Promise<void> {
    try {
      await OTP.deleteMany({
        email,
        purpose,
        verified: true,
      });
    } catch (error) {
      console.error("Failed to delete verified OTP:", error);
    }
  }
}
