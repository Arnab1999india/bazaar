export enum UserRole {
  ADMIN = "admin",
  SELLER = "seller",
  CUSTOMER = "customer",
}

export interface IUser {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  googleId?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserInput {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
  googleId?: string;
  phone?: string;
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IAuthResponse {
  token: string;
  user: Omit<IUser, "password">;
}
