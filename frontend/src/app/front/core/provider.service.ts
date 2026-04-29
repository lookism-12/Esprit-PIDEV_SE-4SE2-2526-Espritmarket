import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { ProviderOrder, ProviderStats } from '../pages/provider-dashboard/provider-dashboard';
import { environment } from '../../../environment';

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/provider`;

  /**
   * Get all orders for the current provider's products
   */
  getProviderOrders(): Observable<ProviderOrder[]> {
    console.log('========================================');
    console.log('🔍 ProviderService.getProviderOrders() called');
    console.log('📍 URL:', `${this.apiUrl}/dashboard/orders`);
    console.log('========================================');
    
    // ✅ FIXED: Use the correct dashboard endpoint
    return this.http.get<ProviderOrder[]>(`${this.apiUrl}/dashboard/orders`).pipe(
      tap((orders) => {
        console.log('========================================');
        console.log('✅ ProviderService: Orders received from backend');
        console.log('📊 Orders count:', orders.length);
        console.log('📦 Orders:', orders);
        console.log('========================================');
      }),
      catchError((error) => {
        console.log('========================================');
        console.error('❌ ProviderService: Failed to get orders');
        console.error('🔍 Error:', error);
        console.log('========================================');
        throw error;
      })
    );
  }

  /**
   * Get detailed information about a specific order
   */
  getOrderDetails(orderId: string): Observable<any> {
    // ✅ FIXED: Use the correct dashboard endpoint
    return this.http.get(`${this.apiUrl}/dashboard/orders/${orderId}`);
  }

  /**
   * Update order status (CONFIRM or CANCEL)
   */
  updateOrderStatus(orderId: string, status: string): Observable<ProviderOrder> {
    // ✅ FIXED: Use the correct orders endpoint for updates
    return this.http.put<ProviderOrder>(
      `${this.apiUrl}/orders/${orderId}/status`,
      {},
      { params: { status: status } }
    );
  }

  /**
   * Update individual product status within an order
   * @deprecated Use updateOrderStatus() instead. This endpoint returns 410 GONE.
   */
  updateProductStatus(orderId: string, cartItemId: string, status: string): Observable<ProviderOrder> {
    console.warn('⚠️ DEPRECATED: updateProductStatus() is deprecated. Use updateOrderStatus() instead.');
    // This endpoint is deprecated and returns 410 GONE
    return this.http.put<ProviderOrder>(
      `${this.apiUrl}/dashboard/orders/${orderId}/items/${cartItemId}/status`,
      {},
      { params: { newStatus: status } }
    );
  }

  /**
   * Get provider dashboard statistics
   */
  getStatistics(): Observable<ProviderStats> {
    console.log('========================================');
    console.log('🔍 ProviderService.getStatistics() called');
    console.log('📍 URL:', `${this.apiUrl}/dashboard/statistics`);
    console.log('========================================');
    
    // ✅ FIXED: Use the correct dashboard endpoint
    return this.http.get<ProviderStats>(`${this.apiUrl}/dashboard/statistics`).pipe(
      tap((stats) => {
        console.log('========================================');
        console.log('✅ ProviderService: Statistics received from backend');
        console.log('📊 Stats:', stats);
        console.log('========================================');
      }),
      catchError((error) => {
        console.log('========================================');
        console.error('❌ ProviderService: Failed to get statistics');
        console.error('🔍 Error:', error);
        console.log('========================================');
        throw error;
      })
    );
  }

  /**
   * Apply discount to a product (seller functionality)
   */
  applyProductDiscount(productId: string, discountPercentage: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/products/${productId}/discount`, {
      discountPercentage: discountPercentage
    });
  }

  /**
   * Request coupon from admin (seller functionality)
   */
  requestCoupon(couponRequest: {
    requestedDiscountType: string;
    requestedDiscountValue: number;
    justification: string;
    targetProducts?: string[];
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/coupon-request`, couponRequest);
  }

  /**
   * Get seller's coupon requests
   */
  getCouponRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/coupon-requests`);
  }

  /**
   * Get returned orders waiting for provider verification and restocking
   * Returns orders with status=RETURNED (not yet RESTOCKED)
   * 
   * IMPORTANT: Filters by Delivery.status = RETURNED (not Order.status)
   * Backend returns OrderResponse[], frontend needs ProviderOrder[]
   */
  getReturnedOrders(): Observable<ProviderOrder[]> {
    console.log('🔄 ProviderService.getReturnedOrders() called');
    console.log('📍 URL:', `${this.apiUrl}/orders/returned`);
    
    return this.http.get<any[]>(`${this.apiUrl}/orders/returned`).pipe(
      tap((response) => {
        console.log('✅ Returned orders response received:', response.length, 'orders');
      }),
      // Transform OrderResponse[] to ProviderOrder[] (flatten items)
      map((orderResponses: any[]) => {
        const providerOrders: ProviderOrder[] = [];
        
        orderResponses.forEach((orderResponse) => {
          // Each OrderResponse has multiple items
          if (orderResponse.items && orderResponse.items.length > 0) {
            orderResponse.items.forEach((item: any) => {
              const providerOrder: ProviderOrder = {
                id: orderResponse.id,
                orderId: orderResponse.id,
                cartItemId: item.id,
                clientName: 'Customer', // Will be populated by backend
                clientEmail: orderResponse.userEmail || 'unknown@example.com',
                clientAvatar: undefined,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.productPrice,
                subTotal: item.subtotal,
                orderStatus: orderResponse.status,
                orderDate: new Date(orderResponse.createdAt)
              };
              providerOrders.push(providerOrder);
            });
          }
        });
        
        console.log('🔄 Transformed to', providerOrders.length, 'ProviderOrder objects');
        return providerOrders;
      }),
      catchError((error) => {
        console.error('❌ Failed to get returned orders:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Provider confirms physical verification and restocking of returned order
   * Changes status from RETURNED to RESTOCKED and restores stock
   */
  restockOrder(orderId: string): Observable<ProviderOrder> {
    console.log('📦 ProviderService.restockOrder() called for:', orderId);
    console.log('📍 URL:', `${this.apiUrl}/orders/${orderId}/pickup`);
    
    return this.http.post<ProviderOrder>(`${this.apiUrl}/orders/${orderId}/pickup`, {}).pipe(
      tap(() => {
        console.log('✅ Order restocked successfully');
      }),
      catchError((error) => {
        console.error('❌ Failed to restock order:', error);
        return throwError(() => error);
      })
    );
  }
}
