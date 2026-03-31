export enum NotificationType {
  NEGOTIATION_UPDATE = 'NEGOTIATION_UPDATE',
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
  PROMOTION = 'PROMOTION',
  SYSTEM = 'SYSTEM',
  RIDE_UPDATE = 'RIDE_UPDATE',
  INTERNAL_NOTIFICATION = 'INTERNAL_NOTIFICATION',
  EXTERNAL_NOTIFICATION = 'EXTERNAL_NOTIFICATION'
}

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  message: string;       // mapped from backend 'description'
  description?: string;  // backend field alias
  read: boolean;
  active: boolean;
  notification_status?: boolean;
  linkedObjectId?: string;
  createdAt: string;
}

export interface AppNotification extends NotificationResponse {}

export interface MarkAsReadRequest {
  notificationId: string;
}

export interface DeactivateNotificationRequest {
  notificationId: string;
}
