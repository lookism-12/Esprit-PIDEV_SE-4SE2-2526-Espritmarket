import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Order, OrderStatus, CreateOrderRequest } from '../models/order.model';

export interface OrderFilter {
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UpdateOrderStatusRequest {
  orderId: string;
  status: OrderStatus;
  note?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private readonly apiUrl = '/api/orders'; // TODO: Configure environment

  // Reactive state
  readonly orders = signal<Order[]>([]);
  readonly selectedOrder = signal<Order | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor() {}

  /**
   * Create a new order from cart
   * @param data - Order creation data
   * @returns Observable with created order
   */
  createOrder(data: CreateOrderRequest): Observable<Order> {
    // TODO: Implement actual HTTP call
    // return this.http.post<Order>(this.apiUrl, data);
    console.log('OrderService.createOrder() called with:', data);
    return of({} as Order);
  }

  /**
   * Update order status (admin/seller)
   * @param request - Status update request
   * @returns Observable with updated order
   */
  updateStatus(request: UpdateOrderStatusRequest): Observable<Order> {
    // TODO: Implement actual HTTP call
    // return this.http.patch<Order>(`${this.apiUrl}/${request.orderId}/status`, {
    //   status: request.status,
    //   note: request.note
    // });
    console.log('OrderService.updateStatus() called with:', request);
    return of({} as Order);
  }

  /**
   * Get all orders for current user (or all orders for admin)
   * @param filter - Optional filter parameters
   * @returns Observable with paginated order list
   */
  getOrders(filter?: OrderFilter): Observable<OrderListResponse> {
    // TODO: Implement actual HTTP call with query params
    // let params = new HttpParams();
    // if (filter?.status) params = params.set('status', filter.status);
    // if (filter?.page) params = params.set('page', filter.page.toString());
    // return this.http.get<OrderListResponse>(this.apiUrl, { params });
    console.log('OrderService.getOrders() called with filter:', filter);
    return of({ orders: [], total: 0, page: 1, totalPages: 0 });
  }

  /**
   * Get a single order by ID
   * @param orderId - Order ID
   * @returns Observable with order details
   */
  getOrderById(orderId: string): Observable<Order> {
    // TODO: Implement actual HTTP call
    // return this.http.get<Order>(`${this.apiUrl}/${orderId}`);
    console.log('OrderService.getOrderById() called with:', orderId);
    return of({} as Order);
  }

  /**
   * Cancel an order (buyer only, before shipping)
   * @param orderId - Order ID to cancel
   * @param reason - Optional cancellation reason
   * @returns Observable with cancelled order
   */
  cancelOrder(orderId: string, reason?: string): Observable<Order> {
    // TODO: Implement actual HTTP call
    // return this.http.post<Order>(`${this.apiUrl}/${orderId}/cancel`, { reason });
    console.log('OrderService.cancelOrder() called with:', orderId, reason);
    return of({} as Order);
  }

  /**
   * Get order tracking information
   * @param orderId - Order ID
   * @returns Observable with tracking data
   */
  getOrderTracking(orderId: string): Observable<{ statusHistory: Order['statusHistory'] }> {
    // TODO: Implement actual HTTP call
    // return this.http.get<{ statusHistory: Order['statusHistory'] }>(`${this.apiUrl}/${orderId}/tracking`);
    console.log('OrderService.getOrderTracking() called with:', orderId);
    return of({ statusHistory: [] });
  }

  /**
   * Get orders by seller (for seller dashboard)
   * @param sellerId - Seller ID
   * @param filter - Optional filter parameters
   * @returns Observable with seller's orders
   */
  getSellerOrders(sellerId: string, filter?: OrderFilter): Observable<OrderListResponse> {
    // TODO: Implement actual HTTP call
    // return this.http.get<OrderListResponse>(`${this.apiUrl}/seller/${sellerId}`, { params: ... });
    console.log('OrderService.getSellerOrders() called with:', sellerId, filter);
    return of({ orders: [], total: 0, page: 1, totalPages: 0 });
  }
}
