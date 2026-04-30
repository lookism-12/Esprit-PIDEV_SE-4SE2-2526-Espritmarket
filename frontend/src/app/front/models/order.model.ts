/**
 * Order Models - Aligned with Backend Order Entity
 * 
 * Order lifecycle: PENDING → CONFIRMED → OUT_FOR_DELIVERY → DELIVERED
 * Payment status: UNPAID or PAID (separate from order status)
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
  paymentStatus?: PaymentStatus;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  couponCode?: string;
  discountId?: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentId?: string;
  cartId?: string;
  deliveryId?: string;
  deliveryStatus?: string;
  deliveryConfirmationCode?: string;
  orderNumber: string;
  createdAt: string;
  paidAt?: string;
  lastUpdated: string;
  confirmedAt?: string;
  deliveryStartedAt?: string;
  deliveredAt?: string;
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
  status: string; // ACTIVE, CANCELLED, etc.
  cancelledQuantity?: number;
  refundedAmount?: number;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  FAILED = 'FAILED'
}

export enum PaymentMethod {
  CARD = 'CARD',
  CASH = 'CASH'
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
