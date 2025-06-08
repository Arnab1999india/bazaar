import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { auth } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import { authValidation } from "../validations/auth.validations";

const router = Router();

// Public routes
router.post(
  "/register",
  validateRequest(authValidation.register),
  AuthController.register
);

router.post(
  "/login",
  validateRequest(authValidation.login),
  AuthController.login
);

router.post(
  "/password-reset-request",
  validateRequest(authValidation.resetPasswordRequest),
  AuthController.requestPasswordReset
);

// OAuth routes
router.get("/google", (req, res) => {
  // Implement Google OAuth initialization
});

router.get("/google/callback", AuthController.googleCallback);

// Protected routes (require authentication)
router.use(auth); // Apply authentication middleware to all routes below

router.get("/profile", AuthController.getProfile);

router.patch(
  "/profile",
  validateRequest(authValidation.updateProfile),
  AuthController.updateProfile
);

router.post(
  "/change-password",
  validateRequest(authValidation.changePassword),
  AuthController.changePassword
);

router.post("/logout", AuthController.logout);

export default router;
