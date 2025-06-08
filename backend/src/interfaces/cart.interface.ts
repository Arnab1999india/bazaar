export interface ICartItem {
  product: string; // Reference to Product ID
  quantity: number;
}

export interface ICart {
  id: string;
  user: string; // Reference to User ID
  items: ICartItem[];
  updatedAt: Date;
}

export interface ICartItemInput {
  productId: string;
  quantity: number;
}

export interface IWishlistItem {
  product: string; // Reference to Product ID
  addedAt: Date;
}

export interface IWishlist {
  id: string;
  user: string; // Reference to User ID
  items: IWishlistItem[];
  updatedAt: Date;
}

// Response interfaces
export interface ICartResponse {
  id: string;
  items: Array<{
    product: {
      id: string;
      name: string;
      price: number;
      imageUrl: string[];
    };
    quantity: number;
  }>;
  totalItems: number;
  totalAmount: number;
}

export interface IWishlistResponse {
  id: string;
  items: Array<{
    product: {
      id: string;
      name: string;
      price: number;
      imageUrl: string[];
      stockStatus: "in-stock" | "out-of-stock";
    };
    addedAt: Date;
  }>;
}
