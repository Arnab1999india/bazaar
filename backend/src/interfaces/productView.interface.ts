export interface IProductView {
  id: string;
  productId: string;
  userId?: string | null;
  sessionId?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductViewInput {
  productId: string;
  userId?: string | null;
  sessionId?: string | null;
  ipAddress?: string | null;
}
