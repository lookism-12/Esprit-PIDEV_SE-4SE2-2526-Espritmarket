import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderResponse, PaymentMethod, PaymentStatus } from '../models/order.model';
import { environment } from '../../../environment';

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

export interface StripePaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
  publishableKey: string;
  amount: number;
  displayAmount: number;
  currency: string;
  status: string;
}

export interface StripePaymentConfirmationRequest {
  orderId: string;
  paymentIntentId: string;
}

export interface CardOtpRequest {
  cardLast4: string;
  cardBrand?: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
}

export interface CardOtpResponse {
  verificationId: string;
  maskedCard: string;
  maskedPhone: string;
  expiresAt: string;
  status: string;
  message: string;
}

export interface CardOtpConfirmationRequest {
  verificationId: string;
  otpCode: string;
}

export interface CardOtpConfirmationResponse {
  transactionId: string;
  status: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly apiUrl = `${environment.apiUrl}/payments`;

  // Reactive state
  readonly isProcessing = signal<boolean>(false);
  readonly lastTransaction = signal<PaymentResponse | null>(null);
  readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  createStripeCartIntent(): Observable<StripePaymentIntentResponse> {
    return this.http.post<StripePaymentIntentResponse>(`${this.apiUrl}/stripe/create-cart-intent`, {});
  }

  confirmStripePayment(request: StripePaymentConfirmationRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.apiUrl}/stripe/confirm`, request);
  }

  requestCardOtp(request: CardOtpRequest): Observable<CardOtpResponse> {
    return this.http.post<CardOtpResponse>(`${this.apiUrl}/card/request-otp`, request);
  }

  confirmCardOtp(request: CardOtpConfirmationRequest): Observable<CardOtpConfirmationResponse> {
    return this.http.post<CardOtpConfirmationResponse>(`${this.apiUrl}/card/confirm-otp`, request);
  }

  /**
   * Process a payment for an order
   * @param request - Payment request with order and payment details
   * @returns Observable with payment response
   */
  processPayment(request: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/process`, request);
  }

  /**
   * Refund a payment (admin/seller only)
   * @param request - Refund request details
   * @returns Observable with refund response
   */
  refundPayment(request: RefundRequest): Observable<RefundResponse> {
    return this.http.post<RefundResponse>(`${this.apiUrl}/refund`, request);
  }

  /**
   * Get payment status by transaction ID
   * @param transactionId - Transaction ID to check
   * @returns Observable with payment response
   */
  getPaymentStatus(transactionId: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.apiUrl}/${transactionId}`);
  }

  /**
   * Get payment history for current user
   * @returns Observable with list of payments
   */
  getPaymentHistory(): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.apiUrl}/history`);
  }

  /**
   * Validate card details (client-side validation)
   * @param card - Card details to validate
   * @returns boolean indicating if card is valid
   */
  validateCard(card: CardDetails): boolean {
    const digits = card.cardNumber.replace(/\D/g, '');
    if (digits.length < 12 || digits.length > 19) return false;
    if (!/^\d{3,4}$/.test(card.cvv)) return false;

    const month = Number(card.expiryMonth);
    const year = Number(card.expiryYear.length === 2 ? `20${card.expiryYear}` : card.expiryYear);
    if (month < 1 || month > 12 || !year) return false;

    const expiresAt = new Date(year, month, 0, 23, 59, 59);
    return expiresAt >= new Date() && this.passesLuhn(digits);
  }

  /**
   * Get available payment methods
   * @returns Observable with available methods
   */
  getAvailableMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.apiUrl}/methods`);
  }

  private passesLuhn(digits: string): boolean {
    let sum = 0;
    let shouldDouble = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let value = Number(digits.charAt(i));
      if (shouldDouble) {
        value *= 2;
        if (value > 9) value -= 9;
      }
      sum += value;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }
}
