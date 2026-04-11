# Payment Integration Guide — Razorpay (Development)

**Last Updated:** 2026-03-30
**Environment:** Development / Test Mode
**Gateway:** Razorpay Test Mode

---

## Overview

Bazaar uses **Razorpay** as the payment gateway. The integration is fully implemented end-to-end in both backend and frontend. This guide covers setup, testing, and the complete payment flow for local development.

---

## Environment Setup

### 1. Get Razorpay Test Credentials

1. Sign up at [https://razorpay.com](https://razorpay.com)
2. Navigate to **Settings → API Keys → Generate Test API Keys**
3. Copy the **Key ID** and **Key Secret**

### 2. Configure Backend

Add to `backend/.env`:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

The backend validates these on startup via `backend/src/config/env.config.ts`.

### 3. Verify Razorpay Config

```typescript
// backend/src/config/razorpay.config.ts
import Razorpay from "razorpay";

export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});
```

---

## Payment Flow (Step-by-Step)

```
Browser                    Angular Frontend              Express Backend          Razorpay
  |                              |                             |                     |
  |-- Click "Pay Now" ---------> |                             |                     |
  |                              |-- POST /api/orders -------> |                     |
  |                              |<-- { orderId, amount } ---- |                     |
  |                              |                             |                     |
  |                              |-- POST /api/payment/ -----> |                     |
  |                              |      create-order           |-- orders.create --> |
  |                              |                             |<-- { order_id } --- |
  |                              |<-- { razorpayOrderId,       |                     |
  |                              |     amount, key } --------- |                     |
  |                              |                             |                     |
  |                              |-- Load Razorpay SDK ------> CDN                  |
  |<-- Razorpay Modal opens ---- |                             |                     |
  |                              |                             |                     |
  |-- Complete Payment --------> |                             |---- Payment ------> |
  |<-- Payment success --------- |                             |                     |
  |  { razorpay_order_id,        |                             |                     |
  |    razorpay_payment_id,      |                             |                     |
  |    razorpay_signature }      |                             |                     |
  |                              |                             |                     |
  |                              |-- POST /api/payment/ -----> |                     |
  |                              |      verify                 |-- HMAC verify ------|
  |                              |<-- { success: true } ------ |                     |
  |                              |                             |                     |
  |                              |-- Clear cart & navigate --> /profile              |
```

---

## Backend Implementation Reference

### Files
| File | Purpose |
|------|---------|
| `config/razorpay.config.ts` | Razorpay SDK instance |
| `routes/payment.routes.ts` | Route definitions |
| `controllers/payment.controller.ts` | Request/response handling |
| `services/payment.service.ts` | Business logic |
| `models/Payment.ts` | Payment record persistence |

### Create Payment Order (`POST /api/payment/create-order`)

```typescript
// payment.service.ts — createPaymentOrder()
const razorpayOrder = await razorpayInstance.orders.create({
  amount: data.amount * 100,    // Convert ₹ to paise
  currency: data.currency || "INR",
  receipt: `order_${data.orderId}`,
  notes: { orderId: data.orderId, userId }
});

await Payment.create({
  razorpayOrderId: razorpayOrder.id,
  amount: data.amount,
  currency: "INR",
  orderId: data.orderId,
  userId,
  status: "created"
});

return {
  paymentId: payment.id,
  razorpayOrderId: razorpayOrder.id,
  amount: data.amount,
  currency: "INR",
  key: process.env.RAZORPAY_KEY_ID
};
```

### Verify Payment (`POST /api/payment/verify`)

```typescript
// payment.service.ts — verifyPayment()
// HMAC-SHA256 signature verification
const generatedSignature = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
  .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
  .digest("hex");

if (generatedSignature !== data.razorpaySignature) {
  throw new AppError(ErrorType.VALIDATION, "Invalid payment signature", 400);
}

// Update payment + order status
payment.status = "captured";
await payment.save();

await Order.findByIdAndUpdate(payment.orderId, {
  paymentStatus: "completed",
  status: "processing"
});
```

---

## Frontend Implementation Reference

### Files
| File | Purpose |
|------|---------|
| `core/services/payment.service.ts` | API calls + SDK loader |
| `features/payment/payment.component.ts` | UI + checkout orchestration |

### Payment Service Key Methods

```typescript
// Load Razorpay SDK dynamically
loadRazorpayScript(): Promise<boolean>

// Create a payment order on the backend
createPaymentOrder(orderId, amount, currency?): Observable<ApiResponse>

// Open the Razorpay checkout modal
openRazorpayCheckout(options: RazorpayOptions): void

// Verify payment with backend after modal success
verifyPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature }): Observable
```

### Payment Component Flow

```typescript
async payNow(): Promise<void> {
  // 1. Create backend order
  const { id: orderId } = await this.createOrder();

  // 2. Create Razorpay payment order
  const paymentOrder = await this.paymentService
    .createPaymentOrder(orderId, this.checkoutState.totals.total)
    .toPromise();

  // 3. Load SDK
  await this.paymentService.loadRazorpayScript();

  // 4. Open checkout modal
  this.paymentService.openRazorpayCheckout({
    key: paymentOrder.data.key,
    amount: paymentOrder.data.amount * 100,  // paise
    currency: "INR",
    order_id: paymentOrder.data.razorpayOrderId,
    handler: (response) => this.handlePaymentSuccess(response),
    ...
  });
}

private handlePaymentSuccess(response): void {
  // 5. Verify signature
  this.paymentService.verifyPayment({
    razorpayOrderId: response.razorpay_order_id,
    razorpayPaymentId: response.razorpay_payment_id,
    razorpaySignature: response.razorpay_signature
  }).subscribe({
    next: () => {
      this.cartService.clear();
      this.router.navigate(['/profile'], { queryParams: { paymentSuccess: true } });
    }
  });
}
```

---

## Test Cards (Razorpay Test Mode)

Use these card numbers in the Razorpay modal during development:

| Scenario | Card Number | CVV | Expiry |
|----------|-------------|-----|--------|
| Successful payment | `4111 1111 1111 1111` | Any 3 digits | Any future date |
| Successful payment | `5267 3181 8797 5449` | Any 3 digits | Any future date |
| Payment failure | `4000 0000 0000 0002` | Any | Any future |
| Insufficient funds | `4000 0000 0000 9995` | Any | Any future |

**UPI Test IDs:**
```
success@razorpay  — Successful payment
failure@razorpay  — Failed payment
```

**Net Banking:** Select any bank → use test credentials shown on Razorpay's test page.

---

## Promo Codes (Development Only)

| Code | Discount |
|------|----------|
| `SAVE50` | ₹50 flat discount |
| `BAZAAR10` | 10% of subtotal |

These are hardcoded in `payment.component.ts` for development. Replace with a real promotions API for production.

---

## Payment Model Schema

```typescript
// models/Payment.ts
{
  razorpayOrderId: string,    // "order_xxx"
  razorpayPaymentId: string,  // "pay_xxx" (filled after payment)
  razorpaySignature: string,  // HMAC (filled after verification)
  amount: number,             // In rupees (not paise)
  currency: string,           // "INR"
  orderId: ObjectId,          // Ref to Order
  userId: ObjectId,           // Ref to User
  status: "created" | "authorized" | "captured" | "failed"
}
```

---

## Order Payment Status Lifecycle

```
Order Created     → paymentStatus: "pending",    status: "pending"
Payment Created   → paymentStatus: "pending",    status: "pending"   (Razorpay order created)
Payment Verified  → paymentStatus: "completed",  status: "processing" (signature verified)
Payment Failed    → paymentStatus: "failed",     status: "pending"
```

---

## Webhooks (Production Setup — Not in Dev)

For production, configure Razorpay webhooks:

1. Dashboard → Settings → Webhooks → Add Webhook
2. URL: `https://yourdomain.com/api/payment/webhook`
3. Events to subscribe: `payment.captured`, `payment.failed`, `order.paid`
4. Verify webhook signature using `X-Razorpay-Signature` header

**Development alternative:** The current flow relies on frontend-driven verification (post-payment callback), which is sufficient for development but should be replaced with webhook-driven verification for production.

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `razorpayInstance.orders.create` fails | Missing/invalid API keys | Check `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env` |
| "Invalid payment signature" | Wrong key secret used in HMAC | Ensure `RAZORPAY_KEY_SECRET` matches Dashboard key |
| Razorpay modal doesn't open | SDK script blocked | Check network/CSP; SDK loads from `checkout.razorpay.com` |
| "Order not found" on create-order | Order ID incorrect | Ensure `orderId` from `POST /api/orders` is passed correctly |
| Amount appears wrong | Paise vs rupees confusion | Backend stores rupees; Razorpay modal receives `amount * 100` (paise) |
| Payment captured but order not updated | Verify endpoint not called | Check `handlePaymentSuccess` callback in payment.component.ts |

---

## Security Checklist

- [x] HMAC-SHA256 signature verification on every payment
- [x] Order ownership check before creating payment order
- [x] Auth required on all payment endpoints
- [x] Amount stored server-side (not trusted from client)
- [ ] Webhook signature verification (needed for production)
- [ ] Idempotency keys on order creation (recommended for production)
- [ ] Payment amount reconciliation with order total (recommended)
