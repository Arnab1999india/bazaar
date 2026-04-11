import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { Payment } from "../models/Payment";
import { Order } from "../models/Order";

interface RawBodyRequest extends Request {
  rawBody?: string;
}

const router = Router();

// Raw body collector middleware (must run before express.json() parses)
function collectRawBody(req: RawBodyRequest, res: Response, next: NextFunction): void {
  let data = "";
  req.setEncoding("utf8");
  req.on("data", (chunk: string) => { data += chunk; });
  req.on("end", () => {
    req.rawBody = data;
    next();
  });
}

async function handleRazorpayWebhook(req: RawBodyRequest, res: Response): Promise<void> {
  const signature = req.headers["x-razorpay-signature"] as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("RAZORPAY_WEBHOOK_SECRET not configured — skipping webhook verification");
    res.status(200).json({ received: true });
    return;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(req.rawBody || "")
    .digest("hex");

  if (expectedSignature !== signature) {
    res.status(400).json({ error: "Invalid webhook signature" });
    return;
  }

  let payload: any;
  try {
    payload = JSON.parse(req.rawBody || "{}");
  } catch {
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }

  const event: string = payload.event;

  try {
    if (event === "payment.captured") {
      const paymentEntity = payload.payload?.payment?.entity;
      if (paymentEntity) {
        const payment = await Payment.findOne({ razorpayOrderId: paymentEntity.order_id });
        if (payment && payment.status !== "captured") {
          payment.razorpayPaymentId = paymentEntity.id;
          (payment.status as any) = "captured";
          await payment.save();
          await Order.findByIdAndUpdate(payment.orderId, {
            paymentStatus: "completed",
            status: "processing",
          });
        }
      }
    } else if (event === "refund.processed") {
      const refundEntity = payload.payload?.refund?.entity;
      if (refundEntity) {
        const payment = await Payment.findOne({ razorpayPaymentId: refundEntity.payment_id });
        if (payment) {
          (payment.status as any) = "refunded";
          await payment.save();
          await Order.findByIdAndUpdate(payment.orderId, {
            paymentStatus: "refunded",
            status: "cancelled",
          });
        }
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
  }

  res.status(200).json({ received: true });
}

router.post("/razorpay", collectRawBody, handleRazorpayWebhook);

export default router;
