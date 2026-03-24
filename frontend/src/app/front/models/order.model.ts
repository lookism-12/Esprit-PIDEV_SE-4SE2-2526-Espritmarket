import { CartItem } from './cart.model';
import { User } from './user.model';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  buyer: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'phone'>;
  sellerId: string;
  seller: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  items: OrderItem[];
  status: OrderStatus;
  statusHistory: OrderStatusHistory[];
  subtotal: number;
  tax: number;
  discount: number;
  shippingCost: number;
  total: number;
  payment: PaymentInfo;
  shipping: ShippingInfo;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface OrderItem extends Omit<CartItem, 'addedAt'> {
  orderId: string;
  status: OrderItemStatus;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
  updatedBy?: string;
}

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: Date;
  amount: number;
}

export interface ShippingInfo {
  method: ShippingMethod;
  address: ShippingAddress;
  estimatedDelivery?: Date;
  trackingNumber?: string;
  deliveredAt?: Date;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  notes?: string;
  isOnCampus: boolean;
  campusLocation?: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum OrderItemStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  FLOUCI = 'FLOUCI',
  D17 = 'D17',
  BANK_TRANSFER = 'BANK_TRANSFER',
  LOYALTY_POINTS = 'LOYALTY_POINTS'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum ShippingMethod {
  CAMPUS_PICKUP = 'CAMPUS_PICKUP',
  CAMPUS_DELIVERY = 'CAMPUS_DELIVERY',
  HOME_DELIVERY = 'HOME_DELIVERY'
}

export interface CreateOrderRequest {
  cartId: string;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethod;
  notes?: string;
  couponCode?: string;
}
