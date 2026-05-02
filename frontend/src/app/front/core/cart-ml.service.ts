import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environment';

export interface CartMLSuggestion {
  product_id: string;
  promotion_suggestion: 'YES' | 'NO';
  price_adjustment: 'INCREASE' | 'DECREASE' | 'STABLE' | 'HOLD';
  confidence_promo: number;
  confidence_price: number;
  recommended_price: number | null;
  expected_impact: string;
  model_used: string;
}

@Injectable({ providedIn: 'root' })
export class CartMLService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/cart/ml`;

  /** Get ML suggestions for all items in the current user's cart */
  getSuggestions(): Observable<CartMLSuggestion[]> {
    return this.http.get<CartMLSuggestion[]>(`${this.base}/suggestions`).pipe(
      catchError(() => of([]))
    );
  }

  /** Get ML suggestion for a single product in the cart */
  getSuggestion(productId: string): Observable<CartMLSuggestion | null> {
    return this.http.get<CartMLSuggestion>(`${this.base}/suggest/${productId}`).pipe(
      catchError(() => of(null))
    );
  }

  /** Check if the ML service is available */
  checkHealth(): Observable<{ cartMLService: string; message: string }> {
    return this.http.get<{ cartMLService: string; message: string }>(`${this.base}/health`).pipe(
      catchError(() => of({ cartMLService: 'DOWN', message: 'ML service unavailable' }))
    );
  }
}
