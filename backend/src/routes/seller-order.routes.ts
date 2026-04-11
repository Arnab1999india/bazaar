import { Router } from "express";
import Joi from "joi";
import { OrderController } from "../controllers/order.controller";
import { auth, authorize } from "../middlewares/auth.middleware";
import { requireApprovedSeller } from "../middlewares/sellerApproval.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import { UserRole } from "../interfaces/user.interface";

const router = Router();

const updateItemStatusSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "processing", "shipped", "delivered", "cancelled")
    .required(),
});

router.use(auth, authorize(UserRole.SELLER), requireApprovedSeller);

router.get("/", OrderController.getSellerOrders);
router.put(
  "/:orderId/items/:itemId/status",
  validateRequest(updateItemStatusSchema),
  OrderController.updateSellerItemStatus
);

export default router;
