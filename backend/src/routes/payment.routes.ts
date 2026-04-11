import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { auth } from "../middlewares/auth.middleware";

const router = Router();

// All payment routes require authentication
router.use(auth);

// Create payment order
router.post("/create-order", PaymentController.createPaymentOrder);

// Verify payment
router.post("/verify", PaymentController.verifyPayment);

// Get payment by order ID
router.get("/order/:orderId", PaymentController.getPaymentByOrderId);

// Refund payment
router.post("/refund", PaymentController.refundPayment);

export default router;
