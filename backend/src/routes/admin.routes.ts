import { Router } from "express";
import Joi from "joi";
import { AdminController } from "../controllers/admin.controller";
import { AdminCategoryController } from "../controllers/admin.category.controller";
import { auth, authorize } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import { asyncHandler } from "../utils/asyncHandler";
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

// Category management
const categorySchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  slug: Joi.string()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9&]+)*$/)
    .optional(),
  parentId: Joi.string().allow(null, "").optional(),
});

router.get("/categories", asyncHandler(AdminCategoryController.list));
router.post(
  "/categories",
  validateRequest(categorySchema),
  asyncHandler(AdminCategoryController.create)
);
router.put(
  "/categories/:id",
  validateRequest(categorySchema),
  asyncHandler(AdminCategoryController.update)
);
router.delete("/categories/:id", asyncHandler(AdminCategoryController.remove));

export default router;
