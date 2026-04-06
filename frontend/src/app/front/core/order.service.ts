import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environment';
import { CartResponse } from '../models/cart.model';

export interface OrderFilter {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface OrderListResponse {
  orders: CartResponse[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UpdateOrderStatusRequest {
  status: string;
}

export interface CancelOrderRequest {
  reason: string;
}

export interface RefundSummaryDTO {
  orderId: string;
  orderStatus: string;
  originalTotal: number;
  refundedAmount: number;
  remainingTotal: number;
  refundedItems: any[];
  refundDate: string;
  loyaltyPointsDeducted: number;
}

export interface Order {
  id: string;
  userId: string;
  status: string;
  total: number;
  items: any[];
  createdAt: string;
  statusHistory?: any[];
}

/**
 * Service for managing orders in the stock reservation system.
 * Handles order status transitions: PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
 * Also handles cancellations which restore stock.
 */
@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  // Reactive state
  readonly orders = signal<CartResponse[]>([]);
  readonly selectedOrder = signal<CartResponse | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Get all orders for the current user
   */
  getMyOrders(): Observable<CartResponse[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<CartResponse[]>(this.apiUrl).pipe(
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
   * Get orders by status
   */
  getOrdersByStatus(status: string): Observable<CartResponse[]> {
    this.isLoading.set(true);
    
    return this.http.get<CartResponse[]>(`${this.apiUrl}/status/${status}`).pipe(
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
  getOrderById(orderId: string): Observable<CartResponse> {
    this.isLoading.set(true);
    
    return this.http.get<CartResponse>(`${this.apiUrl}/${orderId}`).pipe(
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
   * Mark order as paid (PENDING → CONFIRMED)
   */
  markOrderAsPaid(orderId: string): Observable<CartResponse> {
    this.isLoading.set(true);
    
    return this.http.put<CartResponse>(`${this.apiUrl}/${orderId}/pay`, {}).pipe(
      tap(order => {
        this.selectedOrder.set(order);
        this.isLoading.set(false);
        console.log('✅ Order marked as paid:', order);
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
  updateOrderStatus(orderId: string, status: string): Observable<CartResponse> {
    this.isLoading.set(true);
    
    const request: UpdateOrderStatusRequest = { status };
    
    return this.http.put<CartResponse>(`${this.apiUrl}/${orderId}/status`, request).pipe(
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
   * Cancel entire order - RESTORES stock to available inventory
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
  processOrder(orderId: string): Observable<CartResponse> {
    return this.updateOrderStatus(orderId, 'PROCESSING');
  }

  /**
   * Ship order
   */
  shipOrder(orderId: string): Observable<CartResponse> {
    return this.updateOrderStatus(orderId, 'SHIPPED');
  }

  /**
   * Deliver order
   */
  deliverOrder(orderId: string): Observable<CartResponse> {
    return this.updateOrderStatus(orderId, 'DELIVERED');
  }

  /**
   * Get orders with filter
   */
  getOrders(filter?: OrderFilter): Observable<OrderListResponse> {
    console.log('OrderService.getOrders() called with filter:', filter);
    return of({ orders: [], total: 0, page: 1, totalPages: 0 });
  }

  /**
   * Get order tracking information
   */
  getOrderTracking(orderId: string): Observable<{ statusHistory: any[] }> {
    console.log('OrderService.getOrderTracking() called with:', orderId);
    return of({ statusHistory: [] });
  }

  /**
   * Get seller orders
   */
  getSellerOrders(sellerId: string, filter?: OrderFilter): Observable<OrderListResponse> {
    console.log('OrderService.getSellerOrders() called with:', sellerId, filter);
    return of({ orders: [], total: 0, page: 1, totalPages: 0 });
  }

  /**
   * Update status - for backward compatibility
   */
  updateStatus(request: UpdateOrderStatusRequest): Observable<Order> {
    console.log('OrderService.updateStatus() called with:', request);
    return of({} as Order);
  }

  /**
   * Get order status display text
   */
  getOrderStatusDisplay(status: string): string {
    const statusMap: { [key: string]: string } = {
      'DRAFT': 'Draft',
      'PENDING': 'Pending Payment',
      'CONFIRMED': 'Confirmed',
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
      'DRAFT': 'bg-gray-100 text-gray-700',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800', 
      'PAID': 'bg-green-100 text-green-800',
      'PROCESSING': 'bg-purple-100 text-purple-800',
      'SHIPPED': 'bg-indigo-100 text-indigo-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'PARTIALLY_CANCELLED': 'bg-orange-100 text-orange-800',
      'PARTIALLY_REFUNDED': 'bg-orange-100 text-orange-800',
      'REFUNDED': 'bg-gray-100 text-gray-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-700';
  }

  /**
   * Check if order can be cancelled
   */
  canCancelOrder(order: CartResponse): boolean {
    return ['PENDING', 'CONFIRMED', 'PAID'].includes(order.status);
  }

  /**
   * Check if order can be modified
   */
  canModifyOrder(order: CartResponse): boolean {
    return ['PENDING', 'CONFIRMED'].includes(order.status);
  }
}