import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface LoyaltyDashboard {
  totalPoints: number;
  totalPointsEarned: number;
  loyaltyLevel: string;
  currentMultiplier: number;
  ordersThisMonth: number;
  dynamicBoost: number;
  boostTier: string;
  availableRewards: LoyaltyReward[];
  activeRewards: UserReward[];
  topShops: ShopSummary[];
  pointsToNextReward: number | null;
  nextRewardName: string | null;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  rewardType: 'PERCENTAGE_DISCOUNT' | 'FIXED_AMOUNT';
  rewardValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number | null;
  validityDays: number;
  active: boolean;
  displayOrder: number | null;
}

export interface UserReward {
  id: string;
  userId: string;
  rewardId: string;
  rewardName: string;
  rewardValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number | null;
  pointsSpent: number;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
  couponCode: string;
  allowedShopIds: string[];
  allowedShops: ShopSummary[];
  expiresAt: string;
  usedAt: string | null;
  usedInOrderId: string | null;
  actualDiscountApplied: number | null;
  createdAt: string;
  cancelledAt: string | null;
  isExpired: boolean;
  canUse: boolean;
  daysUntilExpiry: number;
}

export interface ShopSummary {
  shopId: string;
  shopName: string;
  orderCount: number;
  totalSpent: number;
}

export interface DynamicBoost {
  dynamicBoost: number;
  effectiveBaseRate: number;
  boostTier: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoyaltyService {
  private apiUrl = `${environment.apiUrl}/loyalty`;

  constructor(private http: HttpClient) {}

  /**
   * Get complete loyalty dashboard
   */
  getDashboard(): Observable<LoyaltyDashboard> {
    return this.http.get<LoyaltyDashboard>(`${this.apiUrl}/dashboard`);
  }

  /**
   * Get all available rewards
   */
  getAvailableRewards(): Observable<LoyaltyReward[]> {
    return this.http.get<LoyaltyReward[]>(`${this.apiUrl}/rewards`);
  }

  /**
   * Get rewards user can afford
   */
  getAffordableRewards(): Observable<LoyaltyReward[]> {
    return this.http.get<LoyaltyReward[]>(`${this.apiUrl}/rewards/affordable`);
  }

  /**
   * Convert points to reward
   */
  convertPointsToReward(rewardId: string): Observable<UserReward> {
    return this.http.post<UserReward>(`${this.apiUrl}/rewards/convert`, { rewardId });
  }

  /**
   * Get user's active rewards
   */
  getMyActiveRewards(): Observable<UserReward[]> {
    return this.http.get<UserReward[]>(`${this.apiUrl}/my-rewards`);
  }

  /**
   * Get user's top 3 shops
   */
  getTopShops(): Observable<ShopSummary[]> {
    return this.http.get<ShopSummary[]>(`${this.apiUrl}/top-shops`);
  }

  /**
   * Get dynamic boost info
   */
  getDynamicBoost(): Observable<DynamicBoost> {
    return this.http.get<DynamicBoost>(`${this.apiUrl}/dynamic-boost`);
  }
}
