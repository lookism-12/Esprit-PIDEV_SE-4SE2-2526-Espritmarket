export enum NegotiationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED'
}

export type NegotiationAction = 'ACCEPT' | 'REJECT' | 'COUNTER';

export enum ProposalStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COUNTERED = 'COUNTERED'
}

export enum ProposalType {
  PROPOSAL = 'PROPOSAL',
  COUNTER_PROPOSAL = 'COUNTER_PROPOSAL'
}

// Modern interface
export interface ProposalResponse {
  senderId?: string;
  senderFullName?: string;
  amount: number;
  message?: string;
  type?: ProposalType;
  status?: ProposalStatus;
  createdAt: string;
}

// Backward-compatible alias
export interface NegotiationProposal extends ProposalResponse {
  proposedPrice?: number;
}

export interface NegotiationResponse {
  id: string;
  clientId: string;
  clientFullName: string;
  serviceId?: string;
  serviceName?: string;
  serviceOriginalPrice?: number;
  productId?: string;
  productName?: string;
  productOriginalPrice?: number;
  status: NegotiationStatus;
  proposals: ProposalResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNegotiationRequest {
  productId: string;
  proposedPrice: number;
}

export interface UpdateNegotiationRequest {
  action: NegotiationAction;
  newPrice?: number;
}

export interface Negotiation extends NegotiationResponse {
  currentOffer?: number;
}
