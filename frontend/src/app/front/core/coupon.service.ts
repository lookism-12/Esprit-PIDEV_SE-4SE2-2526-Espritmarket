import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { 
  Coupon, 
  Promotion, 
  PromotionType, 
  CouponValidationResult, 
  ApplyCouponRequest,
  PromotionFilter,
  PromotionListResponse
} from '../models/promotion.model';

export interface CreateCouponRequest {
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  value: number;
  minCartAmount?: number;
  maxDiscount?: number;
  startDate: Date;
  endDate: Date;
  usageLimit?: number;
  eligibleProducts?: string[];
  eligibleCategories?: string[];
  isPublic?: boolean;
  isSingleUse?: boolean;
}

export interface UpdateCouponRequest extends Partial<CreateCouponRequest> {
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private readonly apiUrl = '/api/coupons'; // TODO: Configure environment

  // Reactive state
  readonly coupons = signal<Coupon[]>([]);
  readonly appliedCoupon = signal<Coupon | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Validate a coupon code
   * @param request - Apply coupon request with code and cart ID
   * @returns Observable with validation result
   */
  validateCoupon(request: ApplyCouponRequest): Observable<CouponValidationResult> {
    // TODO: Implement actual HTTP call
    // return this.http.post<CouponValidationResult>(`${this.apiUrl}/validate`, request);
    console.log('CouponService.validateCoupon() called with:', request);
    
    // Mock validation logic for frontend
    const result: CouponValidationResult = {
      isValid: false,
      errorMessage: 'Coupon validation not implemented yet'
    };
    return of(result);
  }

  /**
   * Apply a coupon to cart
   * @param request - Apply coupon request
   * @returns Observable with updated cart discount
   */
  applyCoupon(request: ApplyCouponRequest): Observable<{ discount: number; coupon: Coupon }> {
    // TODO: Implement actual HTTP call
    // return this.http.post<{ discount: number; coupon: Coupon }>(`${this.apiUrl}/apply`, request);
    console.log('CouponService.applyCoupon() called with:', request);
    return of({ discount: 0, coupon: {} as Coupon });
  }

  /**
   * Remove applied coupon from cart
   * @param cartId - Cart ID
   * @returns Observable with success status
   */
  removeCoupon(cartId: string): Observable<{ success: boolean }> {
    // TODO: Implement actual HTTP call
    // return this.http.delete<{ success: boolean }>(`${this.apiUrl}/cart/${cartId}`);
    console.log('CouponService.removeCoupon() called with cartId:', cartId);
    this.appliedCoupon.set(null);
    return of({ success: true });
  }

  /**
   * Get available public coupons for current user
   * @returns Observable with list of available coupons
   */
  getAvailableCoupons(): Observable<Coupon[]> {
    // TODO: Implement actual HTTP call
    // return this.http.get<Coupon[]>(`${this.apiUrl}/available`);
    console.log('CouponService.getAvailableCoupons() called');
    return of([]);
  }

  /**
   * Get all coupons (admin only)
   * @param filter - Optional filter parameters
   * @returns Observable with paginated coupon list
   */
  getAllCoupons(filter?: PromotionFilter): Observable<PromotionListResponse> {
    // TODO: Implement actual HTTP call
    // return this.http.get<PromotionListResponse>(this.apiUrl, { params: ... });
    console.log('CouponService.getAllCoupons() called with filter:', filter);
    return of({ promotions: [], total: 0, page: 1, totalPages: 0 });
  }

  /**
   * Create a new coupon (admin/seller)
   * @param data - Coupon creation data
   * @returns Observable with created coupon
   */
  createCoupon(data: CreateCouponRequest): Observable<Coupon> {
    // TODO: Implement actual HTTP call
    // return this.http.post<Coupon>(this.apiUrl, data);
    console.log('CouponService.createCoupon() called with:', data);
    return of({} as Coupon);
  }

  /**
   * Update an existing coupon (admin/seller)
   * @param data - Coupon update data
   * @returns Observable with updated coupon
   */
  updateCoupon(data: UpdateCouponRequest): Observable<Coupon> {
    // TODO: Implement actual HTTP call
    // const { id, ...updateData } = data;
    // return this.http.put<Coupon>(`${this.apiUrl}/${id}`, updateData);
    console.log('CouponService.updateCoupon() called with:', data);
    return of({} as Coupon);
  }

  /**
   * Delete a coupon (admin only)
   * @param couponId - Coupon ID to delete
   * @returns Observable with void on success
   */
  deleteCoupon(couponId: string): Observable<void> {
    // TODO: Implement actual HTTP call
    // return this.http.delete<void>(`${this.apiUrl}/${couponId}`);
    console.log('CouponService.deleteCoupon() called with:', couponId);
    return of(void 0);
  }

  /**
   * Toggle coupon active status (admin)
   * @param couponId - Coupon ID
   * @param isActive - New active status
   * @returns Observable with updated coupon
   */
  toggleActive(couponId: string, isActive: boolean): Observable<Coupon> {
    // TODO: Implement actual HTTP call
    // return this.http.patch<Coupon>(`${this.apiUrl}/${couponId}/active`, { isActive });
    console.log('CouponService.toggleActive() called with:', couponId, isActive);
    return of({} as Coupon);
  }

  /**
   * Client-side coupon validation helper
   * Validates basic coupon rules before sending to server
   */
  validateCouponClient(coupon: Coupon, cartTotal: number): CouponValidationResult {
    const now = new Date();
    
    // Check if coupon is active
    if (!coupon.isActive) {
      return { isValid: false, errorMessage: 'This coupon is no longer active' };
    }

    // Check start date
    if (new Date(coupon.startDate) > now) {
      return { isValid: false, errorMessage: 'This coupon is not yet valid' };
    }

    // Check end date
    if (new Date(coupon.endDate) < now) {
      return { isValid: false, errorMessage: 'This coupon has expired' };
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { isValid: false, errorMessage: 'This coupon has reached its usage limit' };
    }

    // Check minimum cart amount
    if (coupon.minCartAmount && cartTotal < coupon.minCartAmount) {
      return { 
        isValid: false, 
        errorMessage: `Minimum cart amount of ${coupon.minCartAmount} TND required` 
      };
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === PromotionType.PERCENTAGE) {
      discount = (cartTotal * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.type === PromotionType.FIXED_AMOUNT) {
      discount = coupon.value;
    }

    return { isValid: true, coupon, discount };
  }
}
