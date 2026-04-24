import { Product } from './product';

// Backend response interfaces (matching Spring Boot DTOs exactly)
export interface CartResponse {
  id: string;
  userId: string;
  creationDate: string;
  lastUpdated: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  status: string;
  items: CartItemResponse[];
  appliedCouponCode?: string;
  appliedDiscountId?: string;
  shippingAddress?: string;
  billingAddress?: string;
  notes?: string;
  totalItems: number;
  totalQuantity: number;
  isEmpty: boolean;
  hasDiscount: boolean;
  savingsAmount: number;
}

export interface CartItemResponse {
  id: string;
  cartId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
  discountApplied: number;
  status: string;
  cancelledQuantity?: number;
  refundAmount?: number;
  cancellationReason?: string;
  availableQuantity: number;
  isPartiallyRefunded: boolean;
  isFullyRefunded: boolean;
  // ✅ ENRICHED PRODUCT FIELDS for frontend display
  imageUrl?: string;
  category?: string;
  sellerName?: string;
  stock?: number;
  stockStatus?: string;
}

// Legacy interfaces for backward compatibility
export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  appliedCoupon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  addedAt: Date;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  shipping: number;
  total: number;
  savings: number;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
  notes?: string;
  negotiatedPrice?: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
