import { Request, Response, NextFunction } from "express";
import { Schema, ValidationErrorItem } from "joi";
import { AppError, ErrorType } from "../interfaces/error.interface";

export const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationOptions = {
      abortEarly: false, // Include all errors
      allowUnknown: true, // Ignore unknown props
      stripUnknown: true, // Remove unknown props
    };

    const { error, value } = schema.validate(req.body, validationOptions);

    if (error) {
      const validationErrors = error.details.map(
        (detail: ValidationErrorItem) => ({
          field: detail.path.join("."),
          message: detail.message,
        })
      );

      next(
        new AppError(
          ErrorType.VALIDATION,
          "Validation error",
          400,
          validationErrors
        )
      );
      return;
    }

    // Replace request body with validated value
    req.body = value;
    next();
  };
};
