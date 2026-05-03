import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environment';
import { Product } from '../../front/models/product';

export interface RecommendationResponse {
  user_id: string;
  recommendations: RecommendedProduct[];
  total_count: number;
  algorithm_used: string;
  generated_at: string;
  // Spring Boot camelCase aliases (Jackson maps both)
  userId?: string;
  totalCount?: number;
  algorithmUsed?: string;
  generatedAt?: string;
}

export interface RecommendedProduct {
  product_id: string;
  name: string;
  category: string;
  price: number;
  score: number;
  reason: string;
  /** Enriched by Spring Boot — Cloudinary/local image URL */
  image_url?: string;
  /** Enriched by Spring Boot — true if stock > 0 */
  in_stock?: boolean;
  /** Enriched by Spring Boot */
  is_negotiable?: boolean;
  // Spring Boot camelCase aliases
  productId?: string;
}

export interface FeedbackResponse {
  user_id: string;
  product_id: string;
  action: string;
  status: string;
  processed_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/recommendation`;

  // Reactive state
  private _recommendations = signal<RecommendedProduct[]>([]);
  recommendations = this._recommendations.asReadonly();

  /**
   * Get product recommendations for a user
   */
  getRecommendations(userId: string): Observable<RecommendationResponse> {
    return this.http.get<RecommendationResponse>(`${this.apiUrl}/${userId}`).pipe(
      tap(response => {
        if (response && response.recommendations) {
          this._recommendations.set(response.recommendations);
        }
      }),
      catchError(err => {
        console.warn('⚠️ Recommendation service unavailable, using empty results', err);
        return of({
          user_id: userId,
          recommendations: [],
          total_count: 0,
          algorithm_used: 'fallback',
          generated_at: new Date().toISOString()
        } as RecommendationResponse);
      })
    );
  }

  /**
   * Track user interaction (view, cart, purchase, like)
   */
  trackInteraction(userId: string, productId: string, action: string): Observable<FeedbackResponse> {
    const payload = { user_id: userId, product_id: productId, action: action };
    return this.http.post<FeedbackResponse>(`${this.apiUrl}/feedback`, payload).pipe(
      catchError(err => {
        console.warn('⚠️ Failed to track interaction', err);
        return of({
          user_id: userId,
          product_id: productId,
          action: action,
          status: 'error',
          processed_at: new Date().toISOString()
        } as FeedbackResponse);
      })
    );
  }
}
