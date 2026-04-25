import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface ProviderCoupon {
  id?: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  scope: 'SHOP_SPECIFIC';
  shopId?: string;
  providerId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProviderCouponService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/provider/coupons`;

  /**
   * Get all coupons for the authenticated provider
   */
  getMyCoupons(): Observable<ProviderCoupon[]> {
    return this.http.get<ProviderCoupon[]>(this.apiUrl);
  }

  /**
   * Create a new coupon
   */
  createCoupon(coupon: ProviderCoupon): Observable<ProviderCoupon> {
    return this.http.post<ProviderCoupon>(this.apiUrl, coupon);
  }

  /**
   * Update an existing coupon
   */
  updateCoupon(id: string, coupon: ProviderCoupon): Observable<ProviderCoupon> {
    return this.http.put<ProviderCoupon>(`${this.apiUrl}/${id}`, coupon);
  }

  /**
   * Toggle coupon active status
   */
  toggleStatus(id: string, isActive: boolean): Observable<ProviderCoupon> {
    return this.http.patch<ProviderCoupon>(`${this.apiUrl}/${id}/status`, { isActive });
  }

  /**
   * Delete a coupon
   */
  deleteCoupon(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
