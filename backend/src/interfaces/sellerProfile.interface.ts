export type SellerProfileStatus = "pending" | "approved" | "rejected";

export interface SellerAddress {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface SellerDocument {
  type: string;
  url: string;
}

export interface ISellerProfile {
  id: string;
  user: string;
  businessName: string;
  legalName?: string | null;
  businessType: string;
  phone: string;
  gstNumber?: string | null;
  panNumber?: string | null;
  shopAddress: SellerAddress;
  warehouseAddress?: SellerAddress | null;
  kycDocuments: SellerDocument[];
  status: SellerProfileStatus;
  rejectionReason?: string | null;
  submittedAt?: Date | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISellerProfileInput {
  businessName: string;
  legalName?: string;
  businessType: string;
  phone: string;
  gstNumber?: string;
  panNumber?: string;
  shopAddress: SellerAddress;
  warehouseAddress?: SellerAddress;
  kycDocuments?: SellerDocument[];
}
