// Backend-aligned notification types
export enum NotificationType {
  // Backend types
  INTERNAL_NOTIFICATION = 'INTERNAL_NOTIFICATION',
  EXTERNAL_NOTIFICATION = 'EXTERNAL_NOTIFICATION',
  RIDE_UPDATE = 'RIDE_UPDATE',
  NEGOTIATION_UPDATE = 'NEGOTIATION_UPDATE',
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
  PROMOTION = 'PROMOTION',
  SYSTEM = 'SYSTEM',

  // Legacy frontend types (kept for backward compatibility)
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_REFUNDED = 'ORDER_REFUNDED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  PRODUCT_SOLD = 'PRODUCT_SOLD',
  PRODUCT_LOW_STOCK = 'PRODUCT_LOW_STOCK',
  PRODUCT_OUT_OF_STOCK = 'PRODUCT_OUT_OF_STOCK',
  NEW_MESSAGE = 'NEW_MESSAGE',
  NEW_REVIEW = 'NEW_REVIEW',
  ACCOUNT_UPDATE = 'ACCOUNT_UPDATE',
  NEW_COUPON = 'NEW_COUPON',
  COUPON_EXPIRING = 'COUPON_EXPIRING',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  MAINTENANCE = 'MAINTENANCE'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

// Backend-aligned response shape
export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string;        // mapped from backend 'description'
  description?: string;   // backend field alias
  read: boolean;
  active: boolean;
  notification_status?: boolean;
  linkedObjectId?: string;
  createdAt: string;
}

// Full app notification (merges backend + frontend fields)
export interface AppNotification extends NotificationResponse {
  userId?: string;
  data?: NotificationData;
  priority?: NotificationPriority;
  isRead?: boolean;
  readAt?: Date;
}

export interface NotificationData {
  orderId?: string;
  productId?: string;
  userId?: string;
  amount?: number;
  link?: string;
  [key: string]: unknown;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  messages: boolean;
  systemAlerts: boolean;
}

export interface WebSocketMessage {
  event: string;
  data: unknown;
  timestamp: Date;
}

export interface NotificationFilter {
  type?: NotificationType;
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface MarkAsReadRequest {
  notificationId: string;
}

export interface DeactivateNotificationRequest {
  notificationId: string;
}
