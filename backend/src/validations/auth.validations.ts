import Joi from "joi";
import { UserRole } from "../interfaces/user.interface";

export const authValidation = {
  register: Joi.object({
    name: Joi.string().required().min(2).max(50).trim().messages({
      "string.empty": "Name is required",
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 50 characters",
    }),

    email: Joi.string().required().email().lowercase().trim().messages({
      "string.empty": "Email is required",
      "string.email": "Please enter a valid email address",
    }),

    password: Joi.string()
      .required()
      .min(6)
      .max(128)
      .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])"))
      .messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 6 characters long",
        "string.max": "Password cannot exceed 128 characters",
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      }),

    role: Joi.string()
      .valid(...Object.values(UserRole))
      .default(UserRole.CUSTOMER),

    phone: Joi.string()
      .pattern(/^\+?[\d\s-]+$/)
      .messages({
        "string.pattern.base": "Please enter a valid phone number",
      }),
  }),

  login: Joi.object({
    email: Joi.string().required().email().lowercase().trim().messages({
      "string.empty": "Email is required",
      "string.email": "Please enter a valid email address",
    }),

    password: Joi.string().required().messages({
      "string.empty": "Password is required",
    }),
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50).trim().messages({
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 50 characters",
    }),

    phone: Joi.string()
      .pattern(/^\+?[\d\s-]+$/)
      .messages({
        "string.pattern.base": "Please enter a valid phone number",
      }),
  })
    .min(1)
    .messages({
      "object.min": "At least one field must be provided for update",
    }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      "string.empty": "Current password is required",
    }),

    newPassword: Joi.string()
      .required()
      .min(6)
      .max(128)
      .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])"))
      .messages({
        "string.empty": "New password is required",
        "string.min": "New password must be at least 6 characters long",
        "string.max": "New password cannot exceed 128 characters",
        "string.pattern.base":
          "New password must contain at least one uppercase letter, one lowercase letter, and one number",
      })
      .disallow(Joi.ref("currentPassword"))
      .messages({
        "any.invalid": "New password must be different from current password",
      }),
  }),

  resetPasswordRequest: Joi.object({
    email: Joi.string().required().email().lowercase().trim().messages({
      "string.empty": "Email is required",
      "string.email": "Please enter a valid email address",
    }),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      "string.empty": "Reset token is required",
    }),

    newPassword: Joi.string()
      .required()
      .min(6)
      .max(128)
      .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])"))
      .messages({
        "string.empty": "New password is required",
        "string.min": "New password must be at least 6 characters long",
        "string.max": "New password cannot exceed 128 characters",
        "string.pattern.base":
          "New password must contain at least one uppercase letter, one lowercase letter, and one number",
      }),
  }),
};
