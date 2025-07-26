export interface IOTP {
  id: string;
  email: string;
  otp: string;
  purpose: "registration" | "password-reset";
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOTPInput {
  email: string;
  purpose: "registration" | "password-reset";
}

export interface IOTPVerifyInput {
  email: string;
  otp: string;
  purpose: "registration" | "password-reset";
}

export interface IOTPResponse {
  message: string;
  expiresIn: number; // Time in minutes
}
