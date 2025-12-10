export type DealType = "lightning" | "featured" | "top-offer";

export interface IDeal {
  id: string;
  productId: string;
  title: string;
  description?: string;
  discountPercentage: number;
  type: DealType;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDealInput {
  productId: string;
  title: string;
  description?: string;
  discountPercentage: number;
  type?: DealType;
  startsAt: Date;
  endsAt: Date;
}
