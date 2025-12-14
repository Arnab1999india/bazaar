export interface IProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryPath?: string[];
  brand?: string;
  imageUrl: string[];
  stockStatus: "in-stock" | "out-of-stock";
  owner: string; // Reference to User ID
  rating: number;
  reviews: string[]; // Array of Review IDs
  tags?: string[];
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
  locations?: ProductLocation[];
  totalStock?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductInput {
  name: string;
  description: string;
  price: number;
  category: string;
  brand?: string;
  imageUrl?: string[];
  stockStatus?: "in-stock" | "out-of-stock";
  tags?: string[];
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
  locations?: ProductLocation[];
  categoryPath?: string[];
}

// export interface IProductQuery {
//   search?: string;
//   category?: string;
//   minPrice?: number;
//   maxPrice?: number;
//   stockStatus?: "in-stock" | "out-of-stock";
//   sortBy?: "price" | "rating" | "createdAt";
//   sortOrder?: "asc" | "desc";
//   page?: number;
//   limit?: number;
// }
export interface IProductQuery {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: string;
  ratingGte?: number;
  attributes?: Record<string, string | string[]>;
  inStock?: boolean;
  sortBy?: "price" | "rating" | "createdAt" | "relevance" | "bestseller";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
export interface IProductUpdateInput extends Partial<IProductInput> {
  id: string;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface ProductVariant {
  sku: string;
  price: number;
  stock: number;
  attributes?: Record<string, string>;
  imageUrls?: string[];
}

export interface ProductLocation {
  country?: string;
  city?: string;
  label?: string;
}
