import { Router } from "express";
import Joi from "joi";
import { AdminController } from "../controllers/admin.controller";
import { auth, authorize } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import { UserRole } from "../interfaces/user.interface";

const router = Router();

// All admin routes require auth + ADMIN role
router.use(auth, authorize(UserRole.ADMIN));

const createAdminSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
});

// Admin management
router.post("/users/admins", validateRequest(createAdminSchema), AdminController.createAdmin);
router.get("/users/admins", AdminController.listAdmins);

// Platform stats
router.get("/stats", AdminController.getPlatformStats);

// User management
router.get("/users", AdminController.listUsers);

// Order management
router.get("/orders", AdminController.listOrders);

export default router;
