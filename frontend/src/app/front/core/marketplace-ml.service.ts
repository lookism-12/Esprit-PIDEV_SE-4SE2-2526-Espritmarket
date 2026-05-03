import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environment';

export interface MarketplaceMLInsight {
  product_id: string;
  promotion_suggestion: 'YES' | 'NO';
  /** INCREASE | DECREASE | STABLE */
  price_adjustment: 'INCREASE' | 'DECREASE' | 'STABLE';
  confidence_promo: number;
  confidence_price: number;
  recommended_price: number | null;
  expected_impact: string;
  model_used: string;
}

@Injectable({ providedIn: 'root' })
export class MarketplaceMLService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/marketplace/ml`;

  /** Single product insight */
  getProductInsight(productId: string): Observable<MarketplaceMLInsight | null> {
    return this.http
      .get<MarketplaceMLInsight>(`${this.base}/product/${productId}`)
      .pipe(catchError(() => of(null)));
  }

  /**
   * Batch insights for a list of product IDs.
   * Returns a Map<productId, insight> for O(1) lookup in templates.
   */
  getBatchInsights(productIds: string[]): Observable<Map<string, MarketplaceMLInsight>> {
    if (!productIds.length) return of(new Map());

    return this.http
      .post<MarketplaceMLInsight[]>(`${this.base}/products/batch`, { productIds })
      .pipe(
        map(results => {
          const m = new Map<string, MarketplaceMLInsight>();
          results.forEach(r => m.set(r.product_id, r));
          return m;
        }),
        catchError(() => of(new Map<string, MarketplaceMLInsight>()))
      );
  }

  /** Health check */
  checkHealth(): Observable<{ status: string; message: string }> {
    return this.http
      .get<{ status: string; message: string }>(`${this.base}/health`)
      .pipe(catchError(() => of({ status: 'DOWN', message: 'ML service unavailable' })));
  }

  // ── UI helpers ──────────────────────────────────────────────────────────────

  /** Badge label shown on product cards */
  getBadgeLabel(insight: MarketplaceMLInsight | null | undefined): string | null {
    if (!insight) return null;
    if (insight.promotion_suggestion === 'YES') return '🏷️ Promo';
    if (insight.price_adjustment === 'INCREASE') return '🔥 Hot';
    if (insight.price_adjustment === 'DECREASE') return '📉 Deal';
    return null;
  }

  /** Tailwind CSS classes for the badge */
  getBadgeClass(insight: MarketplaceMLInsight | null | undefined): string {
    if (!insight) return '';
    if (insight.promotion_suggestion === 'YES')
      return 'bg-orange-100 text-orange-700 border border-orange-200';
    if (insight.price_adjustment === 'INCREASE')
      return 'bg-red-100 text-red-700 border border-red-200';
    if (insight.price_adjustment === 'DECREASE')
      return 'bg-green-100 text-green-700 border border-green-200';
    return 'bg-gray-100 text-gray-600 border border-gray-200';
  }

  /** Short tooltip text */
  getTooltip(insight: MarketplaceMLInsight | null | undefined): string {
    if (!insight) return '';
    return insight.expected_impact || '';
  }

  /** Arrow icon for price direction */
  getPriceArrow(insight: MarketplaceMLInsight | null | undefined): string {
    if (!insight) return '';
    if (insight.price_adjustment === 'INCREASE') return '↑';
    if (insight.price_adjustment === 'DECREASE') return '↓';
    return '';
  }
}
