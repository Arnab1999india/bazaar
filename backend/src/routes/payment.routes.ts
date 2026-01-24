import { Router } from "express";
import Joi from "joi";
import { PaymentController } from "../controllers/payment.controller";
import { auth } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";

const router = Router();

const createOrderSchema = Joi.object({
  amount: Joi.number().min(1).optional(),
  currency: Joi.string().optional(),
  notes: Joi.object().optional(),
});

const verifySchema = Joi.object({
  orderId: Joi.string().required(),
  paymentId: Joi.string().required(),
  signature: Joi.string().required(),
});

router.use(auth);

router.post(
  "/razorpay/create-order",
  validateRequest(createOrderSchema),
  PaymentController.createRazorpayOrder
);
router.post(
  "/razorpay/verify",
  validateRequest(verifySchema),
  PaymentController.verifyRazorpayPayment
);

export default router;
