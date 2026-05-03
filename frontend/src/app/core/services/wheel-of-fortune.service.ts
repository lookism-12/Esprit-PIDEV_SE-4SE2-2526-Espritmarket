import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface RewardDTO {
  id: string;
  label: string;
  type: 'DISCOUNT' | 'FREE_SHIPPING' | 'POINTS' | 'COUPON' | 'NO_LUCK';
  value: number;
  probability: number;
  active: boolean;
  color: string;
  icon: string;
  description: string;
  couponCode?: string;
  minOrderValue?: number;
  expiryDays: number;
  targetSegment: 'NEW' | 'RETURNING' | 'VIP' | 'ALL';
}

export interface SpinResultDTO {
  spinId: string;
  reward: RewardDTO;
  segmentIndex: number;
  rotationDegrees: number;
  expiryDate?: string;
  message: string;
  success: boolean;
}

export interface SpinHistoryDTO {
  id: string;
  userId: string;
  rewardId: string;
  rewardLabel: string;
  rewardType: string;
  rewardValue: number;
  spinTimestamp: string;
  claimed: boolean;
  claimedAt?: string;
  expiryDate?: string;
}

export interface WheelStatsDTO {
  totalSpins: number;
  totalSpinsToday: number;
  uniqueUsers: number;
  rewardDistribution: { [key: string]: number };
  conversionRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class WheelOfFortuneService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/wheel`;

  /**
   * Spin the wheel
   */
  spin(): Observable<SpinResultDTO> {
    return this.http.post<SpinResultDTO>(`${this.apiUrl}/spin`, {});
  }

  /**
   * Get active rewards for wheel display
   */
  getRewards(): Observable<RewardDTO[]> {
    return this.http.get<RewardDTO[]>(`${this.apiUrl}/rewards`);
  }

  /**
   * Check if user can spin today
   */
  canSpin(): Observable<{ canSpin: boolean }> {
    return this.http.get<{ canSpin: boolean }>(`${this.apiUrl}/can-spin`);
  }

  /**
   * Get user's spin history
   */
  getHistory(page: number = 0, size: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/history`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  /**
   * Get unclaimed rewards
   */
  getUnclaimedRewards(): Observable<SpinHistoryDTO[]> {
    return this.http.get<SpinHistoryDTO[]>(`${this.apiUrl}/unclaimed`);
  }

  /**
   * Claim a reward
   */
  claimReward(spinId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/claim/${spinId}`, {});
  }

  /**
   * Get statistics (admin only)
   */
  getStatistics(): Observable<WheelStatsDTO> {
    return this.http.get<WheelStatsDTO>(`${this.apiUrl}/stats`);
  }
}
