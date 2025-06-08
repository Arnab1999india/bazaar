export interface IReview {
  id: string;
  product: string; // Reference to Product ID
  user: string; // Reference to User ID
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReviewInput {
  productId: string;
  rating: number;
  comment: string;
}

export interface IReviewResponse {
  id: string;
  rating: number;
  comment: string;
  user: {
    id: string;
    name: string;
  };
  createdAt: Date;
}

export interface IReviewQuery {
  product?: string;
  user?: string;
  minRating?: number;
  page?: number;
  limit?: number;
}
