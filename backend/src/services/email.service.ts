import nodemailer from "nodemailer";
import { envConfig } from "../config/env.config";
import { AppError, ErrorType } from "../interfaces/error.interface";

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: envConfig.SMTP_HOST,
    port: envConfig.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: envConfig.SMTP_USER,
      pass: envConfig.SMTP_PASS,
    },
  });

  private static async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Bazaar" <${envConfig.SMTP_USER}>`,
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error("EmailService sendMail failed:", error);
      throw new AppError(ErrorType.INTERNAL, "Failed to send email", 500);
    }
  }

  static async sendOTPEmail(
    email: string,
    otp: string,
    purpose: "registration" | "password-reset"
  ): Promise<void> {
    const subject =
      purpose === "registration"
        ? "Verify Your Email - Bazaar"
        : "Password Reset OTP - Bazaar";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${
          purpose === "registration"
            ? "Welcome to Bazaar!"
            : "Password Reset Request"
        }</h2>
        <p style="color: #666; font-size: 16px;">
          ${
            purpose === "registration"
              ? "Thank you for registering with Bazaar. To complete your registration, please use the following OTP:"
              : "You have requested to reset your password. Please use the following OTP to proceed:"
          }
        </p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <h1 style="color: #007bff; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">
          This OTP will expire in 10 minutes for security reasons.
          If you didn't request this, please ignore this email.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This is an automated email, please do not reply.
        </p>
      </div>
    `;

    await this.sendEmail(email, subject, html);
  }

  static async sendSellerApprovalEmail(email: string, businessName: string): Promise<void> {
    const subject = "Your Seller Account Has Been Approved - Bazaar";
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f1111;">
        <div style="background:#131921;padding:16px 24px;">
          <h1 style="color:#ff9900;margin:0;font-size:24px;">Bazaar</h1>
        </div>
        <div style="padding:32px 24px;">
          <h2 style="color:#0f1111;">Congratulations! Your seller account is approved.</h2>
          <p style="font-size:16px;color:#333;">Hi <strong>${businessName}</strong>,</p>
          <p style="font-size:15px;color:#555;line-height:1.6;">
            Great news! Your seller application on <strong>Bazaar</strong> has been reviewed and approved.
            You can now log in to your seller portal and start listing products.
          </p>
          <div style="margin:28px 0;text-align:center;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:4200'}/auth/seller-login"
               style="background:#ff9900;color:#000;padding:12px 32px;border-radius:4px;text-decoration:none;font-weight:700;font-size:15px;">
              Go to Seller Portal
            </a>
          </div>
          <p style="font-size:13px;color:#777;line-height:1.5;">
            If you have any questions, please contact our seller support team.
          </p>
        </div>
        <div style="background:#f2f4f8;padding:12px 24px;text-align:center;">
          <p style="font-size:12px;color:#999;margin:0;">This is an automated email. Please do not reply.</p>
        </div>
      </div>`;
    await this.sendEmail(email, subject, html);
  }

  static async sendOrderConfirmationEmail(
    email: string,
    order: { orderNumber?: string; totalAmount: number; items: Array<{ name?: string; quantity: number; price: number }> }
  ): Promise<void> {
    const subject = `Order Confirmed: ${order.orderNumber || ''} - Bazaar`;
    const itemRows = order.items
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #e7e7e7;">${item.name || 'Product'}</td>
            <td style="padding:8px;border-bottom:1px solid #e7e7e7;text-align:center;">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #e7e7e7;text-align:right;">₹${(item.price * item.quantity).toFixed(2)}</td>
          </tr>`
      )
      .join("");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f1111;">
        <div style="background:#131921;padding:16px 24px;">
          <h1 style="color:#ff9900;margin:0;font-size:24px;">Bazaar</h1>
        </div>
        <div style="padding:32px 24px;">
          <h2>Your order has been confirmed!</h2>
          ${order.orderNumber ? `<p style="font-size:14px;color:#555;">Order Number: <strong>${order.orderNumber}</strong></p>` : ''}
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <thead>
              <tr style="background:#f2f4f8;">
                <th style="padding:8px;text-align:left;font-size:13px;">Item</th>
                <th style="padding:8px;text-align:center;font-size:13px;">Qty</th>
                <th style="padding:8px;text-align:right;font-size:13px;">Price</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:10px 8px;font-weight:700;font-size:15px;">Total</td>
                <td style="padding:10px 8px;font-weight:700;font-size:15px;text-align:right;">₹${order.totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <div style="margin:24px 0;text-align:center;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:4200'}/profile"
               style="background:#ffd814;color:#000;padding:12px 32px;border-radius:4px;text-decoration:none;font-weight:700;font-size:15px;">
              View Order
            </a>
          </div>
          <p style="font-size:13px;color:#777;">Thank you for shopping with Bazaar!</p>
        </div>
        <div style="background:#f2f4f8;padding:12px 24px;text-align:center;">
          <p style="font-size:12px;color:#999;margin:0;">This is an automated email. Please do not reply.</p>
        </div>
      </div>`;
    await this.sendEmail(email, subject, html);
  }
}
