import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { AppError, ErrorType } from "../interfaces/error.interface";
import { envConfig } from "../config/env.config";
import { User } from "../models/User";
import { UserRole } from "../interfaces/user.interface";

export interface AuthRequest extends Request {
  user?: any;
}

export const auth: RequestHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

export const optionalAuth: RequestHandler = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, envConfig.JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Ignore invalid token for optional auth
  }
  next();
};

export const authorize = (...roles: UserRole[]): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(
        new AppError(ErrorType.AUTHENTICATION, "Authentication required", 401)
      );
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new AppError(
          ErrorType.AUTHORIZATION,
          "Not authorized to access this resource",
          403
        )
      );
      return;
    }

    next();
  };
};

export const validateOwnership = (
  resourceUserId: string
): RequestHandler => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(
        new AppError(ErrorType.AUTHENTICATION, "Authentication required", 401)
      );
      return;
    }

    if (req.user.role !== UserRole.ADMIN && req.user.id !== resourceUserId) {
      next(
        new AppError(
          ErrorType.AUTHORIZATION,
          "Not authorized to access this resource",
          403
        )
      );
      return;
    }

    next();
  };
};
