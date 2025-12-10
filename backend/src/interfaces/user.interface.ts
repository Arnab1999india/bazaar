export enum UserRole {
  ADMIN = "admin",
  SELLER = "seller",
  CUSTOMER = "customer",
}

export interface IUser {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  password?: string;
  role: UserRole;
  googleId?: string;
  phone?: string;
  bio?: string | null;
  dateOfBirth?: Date | null;
  locationCity?: string | null;
  locationCountry?: string | null;
  educationSchool?: string | null;
  educationCollege?: string | null;
  profileImageUrl?: string | null;
  isVerified: boolean;
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
  firstName?: string;
  lastName?: string;
  bio?: string;
  dateOfBirth?: Date;
  locationCity?: string;
  locationCountry?: string;
  educationSchool?: string;
  educationCollege?: string;
  profileImageUrl?: string;
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IAuthResponse {
  token: string;
  user: Omit<IUser, "password">;
}
