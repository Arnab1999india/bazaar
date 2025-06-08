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

export class AuthService {
  private static generateToken(userId: string): string {
    const options: SignOptions = {
      expiresIn: "7d", // Use a valid JWT expiration time format
    };
    return jwt.sign({ id: userId }, envConfig.JWT_SECRET as Secret, options);
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

      // Create new user
      const user = await User.create({
        ...userData,
        role: userData.role || UserRole.CUSTOMER,
      });

      const token = this.generateToken(user.id);

      return {
        token,
        user: user.toJSON(),
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
        user: user.toJSON(),
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
        user: user.toJSON(),
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

  static async resetPasswordRequest(email: string): Promise<void> {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AppError(
          ErrorType.NOT_FOUND,
          "No account found with this email",
          404
        );
      }

      // Generate reset token (implement token generation and email sending)
      // TODO: Implement email service to send reset instructions
    } catch (error) {
      throw new AppError(
        ErrorType.INTERNAL,
        "Error processing password reset request",
        500
      );
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

      return user.toJSON();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(ErrorType.INTERNAL, "Error updating profile", 500);
    }
  }
}
