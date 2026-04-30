export type FeedbackType = 'SAV' | 'FEEDBACK';
export type FeedbackStatus = 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED' | 'ARCHIVED';
export type FeedbackPriority = 'LOW' | 'MODERATE' | 'URGENT';
export type DeliveryStatus = 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED' | 'DRIVER_REFUSED';

export interface SavFeedback {
  id: string;
  type: FeedbackType;
  message: string;
  rating: number;
  reason?: string;
  status: FeedbackStatus;
  problemNature?: string;
  priority?: FeedbackPriority;
  desiredSolution?: string;
  positiveTags?: string[];
  recommendsProduct?: boolean;
  adminResponse?: string;
  readByAdmin?: boolean;
  creationDate: string;
  cartItemId: string;
  imageUrls?: string[];
}

export interface SavFeedbackRequest {
  type: FeedbackType;
  message: string;
  rating: number;
  reason?: string;
  status?: string;
  problemNature?: string;
  priority?: string;
  desiredSolution?: string;
  positiveTags?: string[];
  recommendsProduct?: boolean;
  adminResponse?: string;
  readByAdmin?: boolean;
  cartItemId: string;
}

export interface Delivery {
  id: string;
  address: string;
  deliveryDate?: string;
  status: DeliveryStatus;
  userId: string;
  cartId: string;
  orderId?: string;  // Link to Order entity
  deliveredAt?: string;
  returnedAt?: string;
  returnReason?: string;
  // Driver workflow fields
  pendingDriverId?: string;
  declineReason?: string;
  declinedByDriverId?: string;
}

export interface DeliveryRequest {
  address: string;
  deliveryDate?: string;
  status?: string;
  userId: string;
  cartId: string;
}
