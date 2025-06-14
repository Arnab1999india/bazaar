import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { ILoginInput, IUserInput } from "../interfaces/user.interface";
import { AppError, ErrorType } from "../interfaces/error.interface";
import { AuthRequest } from "../middlewares/auth.middleware";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const userData: IUserInput = req.body;
      const result = await AuthService.register(userData);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const credentials: ILoginInput = req.body;
      const result = await AuthService.login(credentials);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      if (!authReq.user) {
        throw new AppError(
          ErrorType.AUTHENTICATION,
          "Google authentication failed",
          401
        );
      }

      const result = await AuthService.googleAuth(authReq.user);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(
          ErrorType.AUTHENTICATION,
          "Authentication required",
          401
        );
      }

      res.status(200).json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          ErrorType.AUTHENTICATION,
          "Authentication required",
          401
        );
      }

      const updatedUser = await AuthService.updateProfile(
        req.user.id,
        req.body
      );

      res.status(200).json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user) {
        throw new AppError(
          ErrorType.AUTHENTICATION,
          "Authentication required",
          401
        );
      }

      const { currentPassword, newPassword } = req.body;

      await AuthService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );

      res.status(200).json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async requestPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email } = req.body;
      await AuthService.resetPasswordRequest(email);

      res.status(200).json({
        success: true,
        message: "Password reset instructions sent to email",
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response) {
    // JWT is stateless, so we just send a success response
    // Client should remove the token
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }
}
