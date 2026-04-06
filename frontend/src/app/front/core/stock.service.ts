import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environment';

export interface ProductStockResponse {
  productId: string;
  stock: number;
  available: boolean;
}

export interface StockUpdateEvent {
  productId: string;
  newStock: number;
  available: boolean;
  operation: 'REDUCED' | 'RESTORED';
}

/**
 * Service responsible for real-time stock management and tracking.
 * Handles stock checks, reservations, and real-time updates.
 */
@Injectable({
  providedIn: 'root'
})
export class StockService {
  private readonly apiUrl = `${environment.apiUrl}/orders`;
  private http = inject(HttpClient);

  // Real-time stock updates
  private stockUpdateSubject = new BehaviorSubject<StockUpdateEvent | null>(null);
  readonly stockUpdated$ = this.stockUpdateSubject.asObservable();

  // Cache for stock information
  private stockCache = signal<Map<string, ProductStockResponse>>(new Map());

  /**
   * Get current stock for a product
   */
  getProductStock(productId: string): Observable<ProductStockResponse> {
    return this.http.get<ProductStockResponse>(`${this.apiUrl}/product/${productId}/stock`);
  }

  /**
   * Check if product is available (stock > 0)
   */
  isProductAvailable(productId: string): Observable<boolean> {
    return new Observable(subscriber => {
      this.getProductStock(productId).subscribe({
        next: (response) => subscriber.next(response.available),
        error: (error) => subscriber.error(error)
      });
    });
  }

  /**
   * Get maximum quantity that can be purchased
   */
  getMaxPurchasableQuantity(productId: string): Observable<number> {
    return new Observable(subscriber => {
      this.getProductStock(productId).subscribe({
        next: (response) => subscriber.next(response.stock),
        error: (error) => subscriber.error(error)
      });
    });
  }

  /**
   * Update stock cache when changes occur
   */
  updateStockCache(productId: string, stock: number, available: boolean, operation: 'REDUCED' | 'RESTORED') {
    const currentCache = this.stockCache();
    currentCache.set(productId, { productId, stock, available });
    this.stockCache.set(new Map(currentCache));

    // Emit stock update event
    this.stockUpdateSubject.next({
      productId,
      newStock: stock,
      available,
      operation
    });
  }

  /**
   * Get cached stock for a product
   */
  getCachedStock(productId: string): ProductStockResponse | null {
    return this.stockCache().get(productId) || null;
  }

  /**
   * Clear stock cache
   */
  clearCache(): void {
    this.stockCache.set(new Map());
  }

  /**
   * Refresh stock for all cached products
   */
  refreshAllCachedStock(): void {
    const cache = this.stockCache();
    cache.forEach((_, productId) => {
      this.getProductStock(productId).subscribe({
        next: (response) => {
          this.updateStockCache(productId, response.stock, response.available, 'RESTORED');
        },
        error: (error) => {
          console.error(`Failed to refresh stock for product ${productId}:`, error);
        }
      });
    });
  }

  /**
   * Determine stock status based on quantity
   */
  getStockStatus(stock: number, threshold: number = 5): 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK' {
    if (stock <= 0) return 'OUT_OF_STOCK';
    if (stock <= threshold) return 'LOW_STOCK';
    return 'IN_STOCK';
  }

  /**
   * Get stock warning message
   */
  getStockWarningMessage(stock: number): string | null {
    if (stock <= 0) return 'This product is currently out of stock';
    if (stock <= 5) return `Only ${stock} items left in stock!`;
    if (stock <= 10) return `Limited stock: ${stock} items remaining`;
    return null;
  }

  /**
   * Validate if requested quantity is available
   */
  validateQuantity(productId: string, requestedQuantity: number): Observable<boolean> {
    return new Observable(subscriber => {
      this.getProductStock(productId).subscribe({
        next: (response) => {
          subscriber.next(response.stock >= requestedQuantity);
        },
        error: (error) => subscriber.error(error)
      });
    });
  }
}