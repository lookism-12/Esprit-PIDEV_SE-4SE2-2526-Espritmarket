// ============================================================
// SAV Module - TypeScript Models
// Matches backend DTOs exactly
// ============================================================

// ---- DELIVERY ----
export type DeliveryStatus = 'PREPARING' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';

export interface Delivery {
  id: string;
  address: string;
  deliveryDate: string; // ISO string
  status: DeliveryStatus;
  userId: string;
  cartId: string;
}

export interface DeliveryRequest {
  address: string;
  deliveryDate: string | null;
  status: string;
  userId: string;
  cartId: string;
}

// ---- SAV FEEDBACK ----
export type FeedbackType = 'SAV' | 'FEEDBACK';
export type FeedbackStatus = 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED' | 'ARCHIVED';
export type FeedbackPriority = 'LOW' | 'MODERATE' | 'URGENT';

export interface SavFeedback {
  id: string;
  type: FeedbackType;
  message: string;
  rating: number; // 1-5
  reason: string;
  status: FeedbackStatus;
  problemNature?: string;
  priority?: FeedbackPriority | string;
  desiredSolution?: string;
  positiveTags?: string[];
  recommendsProduct?: boolean;
  adminResponse?: string;
  readByAdmin?: boolean;
  creationDate: string;
  cartItemId: string;
}

export interface SavFeedbackRequest {
  type: FeedbackType | string;
  message: string;
  rating: number;
  reason: string;
  status: string;
  problemNature?: string;
  priority?: FeedbackPriority | string;
  desiredSolution?: string;
  positiveTags?: string[];
  recommendsProduct?: boolean;
  adminResponse?: string;
  readByAdmin?: boolean;
  cartItemId: string;
}
