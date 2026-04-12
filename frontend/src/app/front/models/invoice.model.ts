import { OrderResponse } from './order.model';
import { User } from './user.model';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  order: OrderResponse;
  sellerId: string;
  seller: InvoiceParty;
  buyerId: string;
  buyer: InvoiceParty;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  shippingCost: number;
  total: number;
  status: InvoiceStatus;
  dueDate?: Date;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceParty {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export interface InvoiceFilter {
  status?: InvoiceStatus;
  sellerId?: string;
  buyerId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}
