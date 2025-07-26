import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { auth, authorize } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import { UserRole } from "../interfaces/user.interface";
import Joi from "joi";

const router = Router();

// Validation schemas
const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    )
    .optional(),
  shippingAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    zipCode: Joi.string().required(),
  }).required(),
  paymentMethod: Joi.string().required(),
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "processing", "shipped", "delivered", "cancelled")
    .required(),
});

// Apply authentication middleware to all order routes
router.use(auth);

// Order routes
router.post(
  "/",
  validateRequest(createOrderSchema),
  OrderController.createOrder
);
router.get("/", OrderController.getUserOrders);
router.get("/stats", OrderController.getOrderStats);
router.get("/:orderId", OrderController.getOrderById);
router.put(
  "/:orderId/status",
  validateRequest(updateOrderStatusSchema),
  OrderController.updateOrderStatus
);
router.put("/:orderId/cancel", OrderController.cancelOrder);

// Admin routes (require admin role)
router.get(
  "/admin/all",
  authorize(UserRole.ADMIN),
  OrderController.getAllOrders
);
router.put(
  "/admin/:orderId/status",
  authorize(UserRole.ADMIN),
  validateRequest(updateOrderStatusSchema),
  OrderController.adminUpdateOrderStatus
);

export default router;
