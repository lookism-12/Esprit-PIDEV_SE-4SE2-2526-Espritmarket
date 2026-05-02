import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environment';

export interface ProductMLPrediction {
  productId: string;
  productName: string;
  category: string;
  currentPrice: number;
  stock: number;
  salesVolume: number;
  promotionSuggestion: 'YES' | 'NO';
  priceAdjustment: 'INCREASE' | 'DECREASE' | 'STABLE' | 'HOLD';
  confidencePromo: number;
  confidencePrice: number;
  recommendedPrice: number | null;
  expectedImpact: string;
  modelUsed: string;
  avgCategoryPrice: number;
  pricePosition: 'ABOVE_MARKET' | 'BELOW_MARKET' | 'AT_MARKET';
  competitorCount: number;
}

export interface CategoryInsight {
  category: string;
  productCount: number;
  avgPrice: number;
  avgStock: number;
  promoCount: number;
  dominantPriceAction: string;
}

export interface ProviderMLAnalytics {
  shopId: string;
  shopName: string;
  totalProducts: number;
  analyzedProducts: number;
  promoEligibleCount: number;
  priceIncreaseCount: number;
  priceDecreaseCount: number;
  priceStableCount: number;
  predictions: ProductMLPrediction[];
  categoryInsights: CategoryInsight[];
  topRecommendations: string[];
}

@Injectable({ providedIn: 'root' })
export class ProviderMLService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/provider/ml`;

  getAnalytics(): Observable<ProviderMLAnalytics | null> {
    return this.http.get<ProviderMLAnalytics>(`${this.base}/analytics`).pipe(
      catchError(err => {
        console.error('ML Analytics failed:', err);
        return of(null);
      })
    );
  }
}
