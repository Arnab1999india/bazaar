import jwt, { SignOptions, Secret } from "jsonwebtoken";
import ms from "ms";
import bcrypt from "bcrypt";
import { User } from "../models/User";
import {
  IUser,
  IUserInput,
  ILoginInput,
  UserRole,
} from "../interfaces/user.interface";
import { AppError, ErrorType } from "../interfaces/error.interface";
import { envConfig } from "../config/env.config";
import { OTPService } from "./otp.service";
import { IOTPInput, IOTPVerifyInput } from "../interfaces/otp.interface";

export class AuthService {
  private static generateToken(userId: string): string {
    const options: SignOptions = {
      expiresIn: "7d", // Use a valid JWT expiration time format
    };
    return jwt.sign({ id: userId }, envConfig.JWT_SECRET as Secret, options);
  }

  static async initiateRegistration(
    userData: IUserInput
  ): Promise<{ message: string }> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new AppError(ErrorType.CONFLICT, "Email already registered", 409);
      }

      // Generate and send OTP
      await OTPService.generateAndSendOTP({
        email: userData.email,
        purpose: "registration",
      });

      // Store user data temporarily (you might want to use Redis or a temporary collection)
      // For now, we'll create the user but keep them unverified
      await User.create({
        ...userData,
        role: userData.role || UserRole.CUSTOMER,
        isVerified: false,
      });

      return {
        message:
          "Registration initiated. Please check your email for OTP verification.",
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorType.INTERNAL,
        "Error initiating registration",
        500
      );
    }
  }

  static async verifyRegistration(
    verifyData: IOTPVerifyInput
  ): Promise<{ token: string; user: IUser }> {
    try {
      // Verify OTP
      await OTPService.verifyOTP(verifyData);

      // Find and update user
      const user = await User.findOne({ email: verifyData.email });
      if (!user) {
        throw new AppError(ErrorType.NOT_FOUND, "User not found", 404);
      }

      // Mark user as verified
      user.isVerified = true;
      await user.save();

      // Clean up verified OTP
      await OTPService.deleteVerifiedOTP(verifyData.email, "registration");

      const token = this.generateToken(user.id);

      return {
        token,
        user: user.toJSON() as IUser,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorType.INTERNAL,
        "Error verifying registration",
        500
      );
    }
  }

  static async register(
    userData: IUserInput
  ): Promise<{ token: string; user: IUser }> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new AppError(ErrorType.CONFLICT, "Email already registered", 409);
      }

      // Create new user (for backward compatibility - direct registration without OTP)
      const user = await User.create({
        ...userData,
        role: userData.role || UserRole.CUSTOMER,
        isVerified: true, // Direct registration is considered verified
      });

      const token = this.generateToken(user.id);

      return {
        token,
        user: user.toJSON() as IUser,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error creating user", 500);
    }
  }

  static async login(
    credentials: ILoginInput
  ): Promise<{ token: string; user: IUser }> {
    try {
      // Find user and select password (it's excluded by default)
      const user = await User.findOne({ email: credentials.email }).select(
        "+password"
      );

      if (!user) {
        throw new AppError(
          ErrorType.AUTHENTICATION,
          "Invalid email or password",
          401
        );
      }

      // Check if user is verified
      if (!user.isVerified) {
        throw new AppError(
          ErrorType.AUTHENTICATION,
          "Please verify your email before logging in",
          401
        );
      }

      // Check password
      const isPasswordValid = await user.comparePassword(credentials.password);
      if (!isPasswordValid) {
        throw new AppError(
          ErrorType.AUTHENTICATION,
          "Invalid email or password",
          401
        );
      }

      const token = this.generateToken(user.id);

      return {
        token,
        user: user.toJSON() as IUser,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error during login", 500);
    }
  }

  static async googleAuth(
    profile: any
  ): Promise<{ token: string; user: IUser }> {
    try {
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          await user.save();
        } else {
          // Create new user
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            role: UserRole.CUSTOMER,
          });
        }
      }

      const token = this.generateToken(user.id);

      return {
        token,
        user: user.toJSON() as IUser,
      };
    } catch (error) {
      throw new AppError(
        ErrorType.INTERNAL,
        "Error during Google authentication",
        500
      );
    }
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const user = await User.findById(userId).select("+password");

      if (!user) {
        throw new AppError(ErrorType.NOT_FOUND, "User not found", 404);
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        throw new AppError(
          ErrorType.AUTHENTICATION,
          "Current password is incorrect",
          401
        );
      }

      // Update password
      user.password = newPassword;
      await user.save();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error changing password", 500);
    }
  }

  static async resetPasswordRequest(
    email: string
  ): Promise<{ message: string }> {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AppError(
          ErrorType.NOT_FOUND,
          "No account found with this email",
          404
        );
      }

      // Generate and send OTP for password reset
      await OTPService.generateAndSendOTP({
        email,
        purpose: "password-reset",
      });

      return {
        message: "Password reset OTP sent to your email",
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorType.INTERNAL,
        "Error processing password reset request",
        500
      );
    }
  }

  static async verifyPasswordResetOTP(
    verifyData: IOTPVerifyInput
  ): Promise<{ message: string }> {
    try {
      // Verify OTP
      await OTPService.verifyOTP(verifyData);

      return {
        message: "OTP verified successfully. You can now reset your password.",
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error verifying OTP", 500);
    }
  }

  static async resetPassword(
    email: string,
    newPassword: string
  ): Promise<{ message: string }> {
    try {
      // Check if OTP was verified for password reset
      const isOTPVerified = await OTPService.isOTPVerified(
        email,
        "password-reset"
      );
      if (!isOTPVerified) {
        throw new AppError(
          ErrorType.AUTHENTICATION,
          "Please verify OTP before resetting password",
          401
        );
      }

      // Find user and update password
      const user = await User.findOne({ email });
      if (!user) {
        throw new AppError(ErrorType.NOT_FOUND, "User not found", 404);
      }

      user.password = newPassword;
      await user.save();

      // Clean up verified OTP
      await OTPService.deleteVerifiedOTP(email, "password-reset");

      return {
        message: "Password reset successfully",
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error resetting password", 500);
    }
  }

  static async resendOTP(data: IOTPInput): Promise<{ message: string }> {
    try {
      await OTPService.resendOTP(data);
      return {
        message: "OTP resent successfully",
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error resending OTP", 500);
    }
  }

  static async updateProfile(
    userId: string,
    updateData: Partial<IUserInput>
  ): Promise<IUser> {
    try {
      // Prevent updating sensitive fields
      delete updateData.password;
      delete updateData.role;
      delete updateData.googleId;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new AppError(ErrorType.NOT_FOUND, "User not found", 404);
      }

      return user.toJSON() as IUser;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error updating profile", 500);
    }
  }
}
