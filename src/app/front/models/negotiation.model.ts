import { Product } from './product';
import { User } from './user.model';

export interface Negotiation {
  id: string;
  productId: string;
  product: Product;
  buyerId: string;
  buyer: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  sellerId: string;
  seller: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  originalPrice: number;
  currentOffer: number;
  status: NegotiationStatus;
  proposals: NegotiationProposal[];
  aiSuggestedPrice?: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface NegotiationProposal {
  id: string;
  negotiationId: string;
  proposedBy: 'buyer' | 'seller';
  userId: string;
  amount: number;
  message?: string;
  status: ProposalStatus;
  createdAt: Date;
  respondedAt?: Date;
}

export enum NegotiationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COUNTER_OFFERED = 'COUNTER_OFFERED',
  EXPIRED = 'EXPIRED',
  CLOSED = 'CLOSED'
}

export enum ProposalStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COUNTER_OFFERED = 'COUNTER_OFFERED',
  EXPIRED = 'EXPIRED'
}

export interface CreateNegotiationRequest {
  productId: string;
  proposedPrice: number;
  message?: string;
}

export interface CounterProposalRequest {
  negotiationId: string;
  amount: number;
  message?: string;
}

export interface NegotiationFilter {
  status?: NegotiationStatus;
  role?: 'buyer' | 'seller';
  page?: number;
  limit?: number;
}

export interface NegotiationListResponse {
  negotiations: Negotiation[];
  total: number;
  page: number;
  totalPages: number;
}
