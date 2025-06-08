export interface IProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string[];
  stockStatus: "in-stock" | "out-of-stock";
  owner: string; // Reference to User ID
  rating: number;
  reviews: string[]; // Array of Review IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductInput {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string[];
  stockStatus?: "in-stock" | "out-of-stock";
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
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: string;
  sortBy?: "price" | "rating" | "createdAt" | "relevance";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
export interface IProductUpdateInput extends Partial<IProductInput> {
  id: string;
}
