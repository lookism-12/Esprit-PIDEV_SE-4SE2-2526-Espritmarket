import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    // ✅ FIXED: Use the correct dashboard endpoint
    return this.http.get<ProviderOrder[]>(`${this.apiUrl}/dashboard/orders`);
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
   */
  updateProductStatus(orderId: string, cartItemId: string, status: string): Observable<ProviderOrder> {
    // ✅ FIXED: Use the correct dashboard endpoint (deprecated but still works)
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
    // ✅ FIXED: Use the correct dashboard endpoint
    return this.http.get<ProviderStats>(`${this.apiUrl}/dashboard/statistics`);
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
