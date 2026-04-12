import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environment';
import { OrderResponse, OrderStatus, ConfirmPaymentRequest, CancelOrderRequest, RefundSummaryDTO } from '../models/order.model';

export interface OrderFilter {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface OrderListResponse {
  orders: OrderResponse[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UpdateOrderStatusRequest {
  status: string;
}

/**
 * Service for managing orders in the e-commerce system.
 * Handles order lifecycle: PENDING → PAID → PROCESSING → SHIPPED → DELIVERED
 * Also handles cancellations which restore stock.
 */
@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  // Reactive state
  readonly orders = signal<OrderResponse[]>([]);
  readonly selectedOrder = signal<OrderResponse | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Get all orders for the current user
   */
  getMyOrders(): Observable<OrderResponse[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<OrderResponse[]>(this.apiUrl).pipe(
      tap(orders => {
        this.orders.set(orders);
        this.isLoading.set(false);
        console.log('✅ Orders loaded:', orders.length);
      }),
      catchError(error => {
        this.error.set('Failed to load orders');
        this.isLoading.set(false);
        console.error('❌ Failed to load orders:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get orders by status
   */
  getOrdersByStatus(status: string): Observable<OrderResponse[]> {
    this.isLoading.set(true);
    
    return this.http.get<OrderResponse[]>(`${this.apiUrl}/status/${status}`).pipe(
      tap(orders => {
        this.orders.set(orders);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.error.set('Failed to load orders');
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get specific order by ID
   */
  getOrderById(orderId: string): Observable<OrderResponse> {
    this.isLoading.set(true);
    
    return this.http.get<OrderResponse>(`${this.apiUrl}/${orderId}`).pipe(
      tap(order => {
        this.selectedOrder.set(order);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.error.set('Failed to load order');
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Confirm payment for order (PENDING → PAID)
   * This triggers stock reduction and loyalty points addition
   */
  confirmPayment(orderId: string, paymentId: string): Observable<OrderResponse> {
    this.isLoading.set(true);
    
    const request: ConfirmPaymentRequest = { paymentId };
    
    return this.http.post<OrderResponse>(`${this.apiUrl}/${orderId}/confirm-payment`, request).pipe(
      tap(order => {
        this.selectedOrder.set(order);
        this.isLoading.set(false);
        console.log('✅ Payment confirmed:', order);
      }),
      catchError(error => {
        this.error.set('Failed to confirm payment');
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update order status (for sellers/admins)
   */
  updateOrderStatus(orderId: string, status: string): Observable<OrderResponse> {
    this.isLoading.set(true);
    
    const request: UpdateOrderStatusRequest = { status };
    
    return this.http.put<OrderResponse>(`${this.apiUrl}/${orderId}/status`, request).pipe(
      tap(order => {
        this.selectedOrder.set(order);
        this.isLoading.set(false);
        console.log('✅ Order status updated:', order);
      }),
      catchError(error => {
        this.error.set('Failed to update order status');
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Confirm order (PENDING → CONFIRMED)
   * Locks the order, no more changes allowed
   */
  confirmOrder(orderId: string): Observable<OrderResponse> {
    this.isLoading.set(true);
    
    return this.http.post<OrderResponse>(`${this.apiUrl}/${orderId}/confirm`, {}).pipe(
      tap(order => {
        this.selectedOrder.set(order);
        this.isLoading.set(false);
        console.log('✅ Order confirmed:', order);
      }),
      catchError(error => {
        this.error.set('Failed to confirm order');
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Decline order (PENDING → DECLINED)
   * Restores product stock
   */
  declineOrder(orderId: string, reason: string): Observable<RefundSummaryDTO> {
    this.isLoading.set(true);
    
    const request: CancelOrderRequest = { reason };
    
    return this.http.post<RefundSummaryDTO>(`${this.apiUrl}/${orderId}/decline`, request).pipe(
      tap(refundSummary => {
        this.isLoading.set(false);
        console.log('✅ Order declined, stock restored:', refundSummary);
      }),
      catchError(error => {
        this.error.set('Failed to decline order');
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cancel entire order - ONLY if status = PENDING
   * Backend will set status to CANCELLED and restore stock
   */
  cancelOrder(orderId: string, reason: string): Observable<RefundSummaryDTO> {
    this.isLoading.set(true);
    
    const request: CancelOrderRequest = { reason };
    
    return this.http.post<RefundSummaryDTO>(`${this.apiUrl}/${orderId}/cancel`, request).pipe(
      tap(refundSummary => {
        this.isLoading.set(false);
        console.log('✅ Order cancelled, stock restored:', refundSummary);
      }),
      catchError(error => {
        this.error.set('Failed to cancel order');
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Process order (start preparation)
   */
  processOrder(orderId: string): Observable<OrderResponse> {
    return this.updateOrderStatus(orderId, 'PROCESSING');
  }

  /**
   * Ship order
   */
  shipOrder(orderId: string): Observable<OrderResponse> {
    return this.updateOrderStatus(orderId, 'SHIPPED');
  }

  /**
   * Deliver order
   */
  deliverOrder(orderId: string): Observable<OrderResponse> {
    return this.updateOrderStatus(orderId, 'DELIVERED');
  }

  /**
   * Get order status display text
   */
  getOrderStatusDisplay(status: string): string {
    const statusMap: { [key: string]: string } = {
      'DRAFT': 'Draft',
      'PENDING': 'Pending Payment',
      'PAID': 'Paid',
      'PROCESSING': 'Processing',
      'SHIPPED': 'Shipped',
      'DELIVERED': 'Delivered',
      'CANCELLED': 'Cancelled',
      'PARTIALLY_CANCELLED': 'Partially Cancelled',
      'PARTIALLY_REFUNDED': 'Partially Refunded',
      'REFUNDED': 'Refunded'
    };
    return statusMap[status] || status;
  }

  /**
   * Get order status color class
   */
  getOrderStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'PAID': 'bg-green-100 text-green-800',
      'DECLINED': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-700';
  }

  /**
   * Check if client can cancel order (within 7 days and PENDING status)
   */
  canClientCancelOrder(orderId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${orderId}/can-cancel`).pipe(
      catchError(error => {
        console.error('❌ Failed to check cancel permission:', error);
        return of(false);
      })
    );
  }

  /**
   * Check if order can be cancelled (ONLY PENDING status)
   */
  canCancelOrder(order: OrderResponse): boolean {
    return order.status === OrderStatus.PENDING;
  }

  /**
   * Check if order can be modified
   */
  canModifyOrder(order: OrderResponse): boolean {
    return order.status === OrderStatus.PENDING;
  }
}