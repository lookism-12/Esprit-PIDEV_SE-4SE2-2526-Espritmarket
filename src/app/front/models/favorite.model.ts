import { Product } from './product';

export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  originalPrice: number;
  currentPrice: number;
  priceChange: PriceChange;
  addedAt: Date;
}

export interface PriceChange {
  type: 'increased' | 'decreased' | 'unchanged';
  amount: number;
  percentage: number;
}

export interface FavoriteListResponse {
  favorites: Favorite[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AddFavoriteRequest {
  productId: string;
}
