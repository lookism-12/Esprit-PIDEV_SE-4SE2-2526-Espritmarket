import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface ReviewRequest {
  rideId: string;
  rating: number;
  comment?: string;
}

export interface ReviewResponse {
  id: string;
  rideId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  revieweeId: string;
  revieweeName: string;
  rating: number;
  comment?: string;
  createdAt: string;
  badge: 'GOLD' | 'SILVER' | 'BRONZE';
}

@Injectable({ providedIn: 'root' })
export class RideReviewService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/ride-reviews`;

  submitReview(req: ReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(this.base, req);
  }

  getReviewsByUser(userId: string): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.base}/user/${userId}`);
  }

  getReviewsByRide(rideId: string): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.base}/ride/${rideId}`);
  }

  canReview(rideId: string): Observable<{ canReview: boolean }> {
    return this.http.get<{ canReview: boolean }>(`${this.base}/can-review/${rideId}`);
  }

  /** Returns star array for template rendering */
  starsArray(rating: number): { filled: boolean }[] {
    return [1, 2, 3, 4, 5].map(i => ({ filled: i <= rating }));
  }

  badgeLabel(badge: string): string {
    if (badge === 'GOLD')   return '⭐ Excellent Driver';
    if (badge === 'SILVER') return '👍 Good Driver';
    return '⚠️ Needs Improvement';
  }

  badgeClass(badge: string): string {
    if (badge === 'GOLD')   return 'bg-amber-100 text-amber-700';
    if (badge === 'SILVER') return 'bg-blue-100 text-blue-700';
    return 'bg-red-100 text-red-700';
  }
}
