import { User } from './user.model';

export interface Delivery {
  id: string;
  orderId: string;
  orderNumber: string;
  driverId?: string;
  driver?: Pick<User, 'id' | 'firstName' | 'lastName' | 'phone' | 'avatar'>;
  status: DeliveryStatus;
  statusHistory: DeliveryStatusHistory[];
  pickupAddress: DeliveryAddress;
  deliveryAddress: DeliveryAddress;
  estimatedPickup?: Date;
  estimatedDelivery?: Date;
  actualPickup?: Date;
  actualDelivery?: Date;
  trackingCode: string;
  notes?: string;
  proofOfDelivery?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isOnCampus: boolean;
  campusBuilding?: string;
}

export interface DeliveryStatusHistory {
  status: DeliveryStatus;
  timestamp: Date;
  location?: string;
  note?: string;
  updatedBy?: string;
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PICKING_UP = 'PICKING_UP',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED'
}

// SAV (Service After Sale) Models
export interface Complaint {
  id: string;
  userId: string;
  orderId?: string;
  productId?: string;
  type: ComplaintType;
  subject: string;
  description: string;
  attachments: string[];
  status: ComplaintStatus;
  priority: Priority;
  resolution?: string;
  assignedTo?: string;
  sentiment?: Sentiment;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export enum ComplaintType {
  PRODUCT_QUALITY = 'PRODUCT_QUALITY',
  DELIVERY_ISSUE = 'DELIVERY_ISSUE',
  WRONG_ITEM = 'WRONG_ITEM',
  DAMAGED_ITEM = 'DAMAGED_ITEM',
  MISSING_ITEM = 'MISSING_ITEM',
  REFUND_REQUEST = 'REFUND_REQUEST',
  SELLER_ISSUE = 'SELLER_ISSUE',
  OTHER = 'OTHER'
}

export enum ComplaintStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_CUSTOMER = 'WAITING_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum Sentiment {
  POSITIVE = 'POSITIVE',
  NEUTRAL = 'NEUTRAL',
  NEGATIVE = 'NEGATIVE'
}

export interface Feedback {
  id: string;
  userId: string;
  orderId?: string;
  productId?: string;
  sellerId?: string;
  type: FeedbackType;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  sentiment?: Sentiment;
  isVerifiedPurchase: boolean;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum FeedbackType {
  PRODUCT_REVIEW = 'PRODUCT_REVIEW',
  SELLER_REVIEW = 'SELLER_REVIEW',
  DELIVERY_REVIEW = 'DELIVERY_REVIEW',
  PLATFORM_FEEDBACK = 'PLATFORM_FEEDBACK'
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderItemId: string;
  userId: string;
  reason: ReturnReason;
  description: string;
  images: string[];
  status: ReturnStatus;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

export enum ReturnReason {
  DEFECTIVE = 'DEFECTIVE',
  NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED',
  WRONG_SIZE = 'WRONG_SIZE',
  CHANGED_MIND = 'CHANGED_MIND',
  BETTER_PRICE = 'BETTER_PRICE',
  OTHER = 'OTHER'
}

export enum ReturnStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ITEM_RECEIVED = 'ITEM_RECEIVED',
  REFUND_PROCESSING = 'REFUND_PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// Request DTOs
export interface CreateComplaintRequest {
  orderId?: string;
  productId?: string;
  type: ComplaintType;
  subject: string;
  description: string;
  attachments?: string[];
}

export interface CreateFeedbackRequest {
  orderId?: string;
  productId?: string;
  sellerId?: string;
  type: FeedbackType;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}

export interface CreateReturnRequest {
  orderId: string;
  orderItemId: string;
  reason: ReturnReason;
  description: string;
  images?: string[];
}
