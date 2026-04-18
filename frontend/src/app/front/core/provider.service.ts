import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
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
}
