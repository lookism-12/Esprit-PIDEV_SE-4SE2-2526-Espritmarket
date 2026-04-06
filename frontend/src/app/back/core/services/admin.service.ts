import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environment';

export interface ProviderWithShop {
  providerId: string;
  providerName: string;
  providerEmail: string;
  shopId: string;
  productCount: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  sellerName: string;
  categoryName: string;
  stockStatus: string;
  isAvailable: boolean;
  status: string;
  images?: { url: string; altText?: string }[];
}

export interface CreateCouponRequest {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  expirationDate: string; // ISO date string (YYYY-MM-DD)
  minCartAmount?: number;
  usageLimit?: number;
  eligibleUserLevel?: string;
  combinableWithDiscount?: boolean;
  description?: string;
  userId?: string; // User who created the coupon (for providers)
}

export interface CouponResponse {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  expirationDate: string;
  active: boolean;
  minCartAmount?: number;
  usageLimit?: number;
  usageCount: number;
  eligibleUserLevel?: string;
  userId?: string;
  combinableWithDiscount?: boolean;
  description?: string;
  isExpired?: boolean;
  isUsageLimitReached?: boolean;
  remainingUsages?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;
  private readonly couponApiUrl = `${environment.apiUrl}/coupons`;
  private http = inject(HttpClient);

  // State
  readonly providers = signal<ProviderWithShop[]>([]);
  readonly selectedProviderProducts = signal<AdminProduct[]>([]);
  readonly allProducts = signal<AdminProduct[]>([]);
  readonly coupons = signal<CouponResponse[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  /**
   * Get all providers with their shops
   */
  getAllProviders(): Observable<ProviderWithShop[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<ProviderWithShop[]>(`${this.apiUrl}/providers`).pipe(
      tap((providers) => {
        this.providers.set(providers);
        this.isLoading.set(false);
        console.log('✅ Providers loaded:', providers.length);
      }),
      catchError((error) => {
        this.error.set('Failed to load providers');
        this.isLoading.set(false);
        console.error('❌ Failed to load providers:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get products by specific provider
   */
  getProductsByProvider(providerId: string): Observable<AdminProduct[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<AdminProduct[]>(`${this.apiUrl}/providers/${providerId}/products`).pipe(
      tap((products) => {
        this.selectedProviderProducts.set(products);
        this.isLoading.set(false);
        console.log(`✅ Products loaded for provider ${providerId}:`, products.length);
      }),
      catchError((error) => {
        this.error.set('Failed to load provider products');
        this.isLoading.set(false);
        console.error('❌ Failed to load provider products:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all products from all providers
   */
  getAllProducts(): Observable<AdminProduct[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<AdminProduct[]>(`${this.apiUrl}/products`).pipe(
      tap((products) => {
        this.allProducts.set(products);
        this.isLoading.set(false);
        console.log('✅ All products loaded:', products.length);
      }),
      catchError((error) => {
        this.error.set('Failed to load all products');
        this.isLoading.set(false);
        console.error('❌ Failed to load all products:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a new coupon
   */
  createCoupon(request: CreateCouponRequest): Observable<CouponResponse> {
    console.log('AdminService.createCoupon() called with:', request);
    console.log('API URL:', this.couponApiUrl);
    
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<CouponResponse>(this.couponApiUrl, request).pipe(
      tap((coupon) => {
        // Add to local coupons list
        this.coupons.update(coupons => [...coupons, coupon]);
        this.isLoading.set(false);
        console.log('✅ Coupon created successfully:', coupon);
      }),
      catchError((error) => {
        this.error.set('Failed to create coupon');
        this.isLoading.set(false);
        console.error('❌ Failed to create coupon:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all coupons
   */
  getAllCoupons(): Observable<CouponResponse[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<CouponResponse[]>(this.couponApiUrl).pipe(
      tap((coupons) => {
        this.coupons.set(coupons);
        this.isLoading.set(false);
        console.log('✅ Coupons loaded:', coupons.length);
      }),
      catchError((error) => {
        this.error.set('Failed to load coupons');
        this.isLoading.set(false);
        console.error('❌ Failed to load coupons:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete a coupon
   */
  deleteCoupon(couponId: string): Observable<void> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.delete<void>(`${this.couponApiUrl}/${couponId}`).pipe(
      tap(() => {
        // Remove from local coupons list
        this.coupons.update(coupons => coupons.filter(c => c.id !== couponId));
        this.isLoading.set(false);
        console.log('✅ Coupon deleted:', couponId);
      }),
      catchError((error) => {
        this.error.set('Failed to delete coupon');
        this.isLoading.set(false);
        console.error('❌ Failed to delete coupon:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Reset selected provider products
   */
  clearSelectedProviderProducts(): void {
    this.selectedProviderProducts.set([]);
  }
}