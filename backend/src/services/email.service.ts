import nodemailer from "nodemailer";
import { envConfig } from "../config/env.config";
import { AppError, ErrorType } from "../interfaces/error.interface";

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: envConfig.SMTP_HOST,
    port: envConfig.SMTP_PORT,
    secure: true, // true for 465, false for other ports
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
}
