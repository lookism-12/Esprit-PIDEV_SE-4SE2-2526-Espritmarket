// WebSocket notification types for real-time updates

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum NotificationType {
  // Order notifications
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_REFUNDED = 'ORDER_REFUNDED',

  // Payment notifications
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',

  // Product notifications
  PRODUCT_SOLD = 'PRODUCT_SOLD',
  PRODUCT_LOW_STOCK = 'PRODUCT_LOW_STOCK',
  PRODUCT_OUT_OF_STOCK = 'PRODUCT_OUT_OF_STOCK',

  // User notifications
  NEW_MESSAGE = 'NEW_MESSAGE',
  NEW_REVIEW = 'NEW_REVIEW',
  ACCOUNT_UPDATE = 'ACCOUNT_UPDATE',

  // Promotion notifications
  NEW_COUPON = 'NEW_COUPON',
  COUPON_EXPIRING = 'COUPON_EXPIRING',

  // System notifications
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  MAINTENANCE = 'MAINTENANCE'
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
