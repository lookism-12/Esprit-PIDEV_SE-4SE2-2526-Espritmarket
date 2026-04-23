import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

/**
 * Product Review DTO
 */
export interface ProductReviewDto {
  id?: string;
  productId: string;
  productName?: string;
  shopId?: string;
  sellerId?: string;
  customerId: string;
  customerName?: string;
  orderItemId: string;
  
  rating: number; // 1-5 stars
  comment?: string;
  
  createdAt?: Date;
  verified?: boolean;
  approved?: boolean;
}

/**
 * Product Review Service
 * Handles customer reviews and ratings
 */
@Injectable({
  providedIn: 'root'
})
export class ProductReviewService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reviews`;
  
  /**
   * Create a new product review
   */
  createReview(review: ProductReviewDto): Observable<ProductReviewDto> {
    return this.http.post<ProductReviewDto>(this.apiUrl, review);
  }
  
  /**
   * Get all reviews for a product
   */
  getProductReviews(productId: string): Observable<ProductReviewDto[]> {
    return this.http.get<ProductReviewDto[]>(`${this.apiUrl}/products/${productId}`);
  }
  
  /**
   * Get all reviews for a seller
   */
  getSellerReviews(sellerId: string): Observable<ProductReviewDto[]> {
    return this.http.get<ProductReviewDto[]>(`${this.apiUrl}/sellers/${sellerId}`);
  }
  
  /**
   * Calculate average rating from reviews
   */
  calculateAverageRating(reviews: ProductReviewDto[]): number {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  }
  
  /**
   * Get rating distribution (for charts)
   */
  getRatingDistribution(reviews: ProductReviewDto[]): Record<number, number> {
    const distribution: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating]++;
      }
    });
    
    return distribution;
  }
  
  /**
   * Format rating for display (e.g., "4.5")
   */
  formatRating(rating: number): string {
    return rating.toFixed(1);
  }
  
  /**
   * Get star icons for rating display
   */
  getStarIcons(rating: number): string[] {
    const stars: string[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐');
    }
    
    if (hasHalfStar) {
      stars.push('⭐'); // You can use a half-star icon if available
    }
    
    while (stars.length < 5) {
      stars.push('☆');
    }
    
    return stars;
  }
}
