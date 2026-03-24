import { Product } from './product';

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  value: number; // Percentage or fixed amount
  minCartAmount?: number;
  maxDiscount?: number;
  startDate: Date;
  endDate: Date;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  eligibleProducts?: string[]; // Product IDs
  eligibleCategories?: string[];
  eligibleUserRoles?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon extends Promotion {
  isPublic: boolean; // Can be discovered by users
  isSingleUse: boolean; // One use per user
}

export enum PromotionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
  BUY_X_GET_Y = 'BUY_X_GET_Y'
}

export interface ApplyCouponRequest {
  code: string;
  cartId: string;
}

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discount?: number;
  errorMessage?: string;
  errorCode?: CouponErrorCode;
}

export enum CouponErrorCode {
  INVALID_CODE = 'INVALID_CODE',
  EXPIRED = 'EXPIRED',
  NOT_STARTED = 'NOT_STARTED',
  USAGE_LIMIT_REACHED = 'USAGE_LIMIT_REACHED',
  ALREADY_USED = 'ALREADY_USED',
  MIN_CART_AMOUNT_NOT_MET = 'MIN_CART_AMOUNT_NOT_MET',
  NOT_ELIGIBLE = 'NOT_ELIGIBLE',
  INACTIVE = 'INACTIVE'
}

export interface PromotionFilter {
  type?: PromotionType;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface PromotionListResponse {
  promotions: Promotion[];
  total: number;
  page: number;
  totalPages: number;
}
