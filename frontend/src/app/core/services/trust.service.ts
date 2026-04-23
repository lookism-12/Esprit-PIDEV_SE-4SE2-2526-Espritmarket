import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

/**
 * Trust Badge enum matching backend
 */
export enum TrustBadge {
  NEW_SELLER = 'NEW_SELLER',
  GROWING_SELLER = 'GROWING_SELLER',
  TRUSTED_SELLER = 'TRUSTED_SELLER',
  TOP_SELLER = 'TOP_SELLER'
}

/**
 * Trust Score DTO
 */
export interface TrustScoreDto {
  sellerId: string;
  sellerName: string;
  trustScore: number;
  trustBadge: string;
  badgeColor: string;
  
  // Statistics
  totalSales: number;
  approvedProducts: number;
  rejectedProducts: number;
  averageRating: number;
  totalRatings: number;
  
  // Component scores
  ratingComponent?: number;
  salesComponent?: number;
  approvalComponent?: number;
  rejectionPenalty?: number;
}

/**
 * Trust Badge Configuration
 */
export interface TrustBadgeConfig {
  name: string;
  displayName: string;
  color: string;
  bgColor: string;
  icon: string;
  minScore: number;
  maxScore: number;
}

@Injectable({
  providedIn: 'root'
})
export class TrustService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/trust`;
  
  /**
   * Badge configurations for UI display
   */
  private badgeConfigs: Record<string, TrustBadgeConfig> = {
    'NEW_SELLER': {
      name: 'NEW_SELLER',
      displayName: 'New Seller',
      color: '#9CA3AF',
      bgColor: '#F3F4F6',
      icon: '🌱',
      minScore: 0,
      maxScore: 29
    },
    'GROWING_SELLER': {
      name: 'GROWING_SELLER',
      displayName: 'Growing Seller',
      color: '#3B82F6',
      bgColor: '#DBEAFE',
      icon: '📈',
      minScore: 30,
      maxScore: 59
    },
    'TRUSTED_SELLER': {
      name: 'TRUSTED_SELLER',
      displayName: 'Trusted Seller',
      color: '#10B981',
      bgColor: '#D1FAE5',
      icon: '✅',
      minScore: 60,
      maxScore: 79
    },
    'TOP_SELLER': {
      name: 'TOP_SELLER',
      displayName: 'Top Seller',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      icon: '⭐',
      minScore: 80,
      maxScore: 100
    }
  };
  
  /**
   * Get seller's trust score
   */
  getSellerTrustScore(sellerId: string): Observable<TrustScoreDto> {
    return this.http.get<TrustScoreDto>(`${this.apiUrl}/sellers/${sellerId}/score`);
  }
  
  /**
   * Get seller's trust badge
   */
  getSellerBadge(sellerId: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/sellers/${sellerId}/badge`, { responseType: 'text' });
  }
  
  /**
   * Recalculate seller's trust score (admin)
   */
  recalculateTrustScore(sellerId: string): Observable<TrustScoreDto> {
    return this.http.post<TrustScoreDto>(`${this.apiUrl}/sellers/${sellerId}/recalculate`, {});
  }
  
  /**
   * Get shop's trust score
   */
  getShopTrustScore(shopId: string): Observable<TrustScoreDto> {
    return this.http.get<TrustScoreDto>(`${this.apiUrl}/shops/${shopId}/score`);
  }
  
  /**
   * Get badge configuration
   */
  getBadgeConfig(badgeName: string): TrustBadgeConfig {
    return this.badgeConfigs[badgeName] || this.badgeConfigs['NEW_SELLER'];
  }
  
  /**
   * Get badge from score
   */
  getBadgeFromScore(score: number): TrustBadgeConfig {
    if (score < 30) return this.badgeConfigs['NEW_SELLER'];
    if (score < 60) return this.badgeConfigs['GROWING_SELLER'];
    if (score < 80) return this.badgeConfigs['TRUSTED_SELLER'];
    return this.badgeConfigs['TOP_SELLER'];
  }
  
  /**
   * Format trust score for display
   */
  formatScore(score: number): string {
    return score.toFixed(1);
  }
  
  /**
   * Get score color class
   */
  getScoreColorClass(score: number): string {
    if (score < 30) return 'text-gray-600';
    if (score < 60) return 'text-blue-600';
    if (score < 80) return 'text-green-600';
    return 'text-yellow-600';
  }
  
  /**
   * Get score background color class
   */
  getScoreBgClass(score: number): string {
    if (score < 30) return 'bg-gray-100';
    if (score < 60) return 'bg-blue-100';
    if (score < 80) return 'bg-green-100';
    return 'bg-yellow-100';
  }
}
