import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError, ErrorType } from "../interfaces/error.interface";
import { envConfig } from "../config/env.config";
import { User } from "../models/User";
import { UserRole } from "../interfaces/user.interface";

export interface AuthRequest extends Request {
  user?: any;
}

export const auth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new AppError(
        ErrorType.AUTHENTICATION,
        "Authentication required",
        401
      );
    }

    const decoded = jwt.verify(token, envConfig.JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AppError(ErrorType.AUTHENTICATION, "User not found", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(
      new AppError(
        ErrorType.AUTHENTICATION,
        "Invalid authentication token",
        401
      )
    );
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new AppError(ErrorType.AUTHENTICATION, "Authentication required", 401)
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          ErrorType.AUTHORIZATION,
          "Not authorized to access this resource",
          403
        )
      );
    }

    next();
  };
};

export const validateOwnership = (resourceUserId: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new AppError(ErrorType.AUTHENTICATION, "Authentication required", 401)
      );
    }

    if (req.user.role !== UserRole.ADMIN && req.user.id !== resourceUserId) {
      return next(
        new AppError(
          ErrorType.AUTHORIZATION,
          "Not authorized to access this resource",
          403
        )
      );
    }

    next();
  };
};
