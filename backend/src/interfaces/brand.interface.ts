export interface IBrand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  categoryIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IBrandInput {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  categoryIds?: string[];
}
