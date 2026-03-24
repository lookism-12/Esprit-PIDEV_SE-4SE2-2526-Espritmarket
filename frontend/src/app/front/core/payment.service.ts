import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { PaymentMethod, PaymentStatus } from '../models/order.model';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  cardDetails?: CardDetails;
  mobilePaymentDetails?: MobilePaymentDetails;
}

export interface CardDetails {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
}

export interface MobilePaymentDetails {
  phoneNumber: string;
  provider: 'FLOUCI' | 'D17';
}

export interface PaymentResponse {
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  method: PaymentMethod;
  processedAt: Date;
  receiptUrl?: string;
}

export interface RefundRequest {
  transactionId: string;
  amount: number;
  reason: string;
}

export interface RefundResponse {
  refundId: string;
  transactionId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  processedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly apiUrl = '/api/payments'; // TODO: Configure environment

  // Reactive state
  readonly isProcessing = signal<boolean>(false);
  readonly lastTransaction = signal<PaymentResponse | null>(null);
  readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Process a payment for an order
   * @param request - Payment request with order and payment details
   * @returns Observable with payment response
   */
  processPayment(request: PaymentRequest): Observable<PaymentResponse> {
    // TODO: Implement actual HTTP call
    // return this.http.post<PaymentResponse>(`${this.apiUrl}/process`, request);
    console.log('PaymentService.processPayment() called with:', request);
    return of({} as PaymentResponse);
  }

  /**
   * Refund a payment (admin/seller only)
   * @param request - Refund request details
   * @returns Observable with refund response
   */
  refundPayment(request: RefundRequest): Observable<RefundResponse> {
    // TODO: Implement actual HTTP call
    // return this.http.post<RefundResponse>(`${this.apiUrl}/refund`, request);
    console.log('PaymentService.refundPayment() called with:', request);
    return of({} as RefundResponse);
  }

  /**
   * Get payment status by transaction ID
   * @param transactionId - Transaction ID to check
   * @returns Observable with payment response
   */
  getPaymentStatus(transactionId: string): Observable<PaymentResponse> {
    // TODO: Implement actual HTTP call
    // return this.http.get<PaymentResponse>(`${this.apiUrl}/${transactionId}`);
    console.log('PaymentService.getPaymentStatus() called with:', transactionId);
    return of({} as PaymentResponse);
  }

  /**
   * Get payment history for current user
   * @returns Observable with list of payments
   */
  getPaymentHistory(): Observable<PaymentResponse[]> {
    // TODO: Implement actual HTTP call
    // return this.http.get<PaymentResponse[]>(`${this.apiUrl}/history`);
    console.log('PaymentService.getPaymentHistory() called');
    return of([]);
  }

  /**
   * Validate card details (client-side validation)
   * @param card - Card details to validate
   * @returns boolean indicating if card is valid
   */
  validateCard(card: CardDetails): boolean {
    // TODO: Implement card validation logic (Luhn algorithm, expiry check, etc.)
    console.log('PaymentService.validateCard() called');
    return false;
  }

  /**
   * Get available payment methods
   * @returns Observable with available methods
   */
  getAvailableMethods(): Observable<PaymentMethod[]> {
    // TODO: Implement actual HTTP call or return static list
    // return this.http.get<PaymentMethod[]>(`${this.apiUrl}/methods`);
    console.log('PaymentService.getAvailableMethods() called');
    return of([]);
  }
}
