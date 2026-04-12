/**
 * Order Models - Aligned with Backend Order Entity
 * 
 * These models match the backend OrderResponse and OrderItemResponse DTOs.
 * Order lifecycle: PENDING → PAID → PROCESSING → SHIPPED → DELIVERED
 */

export interface OrderResponse {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: OrderStatus;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponCode?: string;
  discountId?: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentId?: string;
  orderNumber: string;
  createdAt: string;
  paidAt?: string;
  lastUpdated: string;
  cancellationReason?: string;
  cancelledAt?: string;
  items: OrderItemResponse[];
}

export interface OrderItemResponse {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
  status: OrderItemStatus;
  cancelledQuantity?: number;
  refundedAmount?: number;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  DECLINED = 'DECLINED'
}

export enum OrderItemStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  PARTIALLY_CANCELLED = 'PARTIALLY_CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

export interface CreateOrderRequest {
  shippingAddress: string;
  paymentMethod: string;
}

export interface ConfirmPaymentRequest {
  paymentId: string;
}

export interface CancelOrderRequest {
  reason: string;
}

export interface CancelOrderItemRequest {
  cartItemId: string; // Note: Backend still uses "cartItemId" for backward compatibility
  quantityToCancel?: number;
  reason?: string;
}

export interface RefundSummaryDTO {
  orderId: string;
  orderStatus: string;
  originalTotal: number;
  refundedAmount: number;
  remainingTotal: number;
  refundedItems?: RefundedItemDTO[];
  refundDate?: string;
  loyaltyPointsDeducted?: number;
}

export interface RefundedItemDTO {
  cartItemId: string;
  productName: string;
  cancelledQuantity: number;
  refundAmount: number;
  status: string;
}
