import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import { auth } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import Joi from "joi";

const router = Router();

// Validation schemas
const addToCartSchema = Joi.object({
  productId: Joi.string().required().messages({
    "string.empty": "Product ID is required",
    "any.required": "Product ID is required",
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    "number.base": "Quantity must be a number",
    "number.integer": "Quantity must be an integer",
    "number.min": "Quantity must be at least 1",
    "any.required": "Quantity is required",
  }),
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required().messages({
    "number.base": "Quantity must be a number",
    "number.integer": "Quantity must be an integer",
    "number.min": "Quantity must be at least 0",
    "any.required": "Quantity is required",
  }),
});

// Apply authentication middleware to all cart routes
// router.use(auth);

// Cart routes
router.get("/", CartController.getCart);
router.get("/count", CartController.getCartItemCount);
router.post("/add", validateRequest(addToCartSchema), CartController.addToCart);
router.put(
  "/item/:productId",
  validateRequest(updateCartItemSchema),
  CartController.updateCartItem
);
router.delete("/item/:productId", CartController.removeFromCart);
router.delete("/clear", CartController.clearCart);

export default router;
