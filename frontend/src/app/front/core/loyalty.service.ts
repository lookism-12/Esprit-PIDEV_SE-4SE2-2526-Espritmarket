import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import {
  LoyaltyAccount,
  LoyaltyLevel,
  PointsTransaction,
  RedeemPointsRequest,
  LOYALTY_LEVELS
} from '../models/loyalty.model';

@Injectable({
  providedIn: 'root'
})
export class LoyaltyService {
  private readonly apiUrl = '/api/loyalty';

  readonly account = signal<LoyaltyAccount | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly currentPoints = computed(() => this.account()?.points ?? 0);
  readonly currentLevel = computed(() => this.account()?.level ?? LoyaltyLevel.BRONZE);
  readonly progressToNextLevel = computed(() => {
    const account = this.account();
    if (!account) return 0;
    const currentLevelInfo = LOYALTY_LEVELS.find(l => l.level === account.level);
    if (!currentLevelInfo || currentLevelInfo.maxPoints === Infinity) return 100;
    const pointsInLevel = account.points - currentLevelInfo.minPoints;
    const levelRange = currentLevelInfo.maxPoints - currentLevelInfo.minPoints;
    return Math.min(100, Math.round((pointsInLevel / levelRange) * 100));
  });

  constructor(private http: HttpClient) {}

  getAccount(): Observable<LoyaltyAccount> {
    // TODO: Implement HTTP call
    console.log('LoyaltyService.getAccount() called');
    return of({} as LoyaltyAccount);
  }

  getHistory(page = 1, limit = 20): Observable<{ transactions: PointsTransaction[]; total: number }> {
    // TODO: Implement HTTP call
    console.log('LoyaltyService.getHistory() called');
    return of({ transactions: [], total: 0 });
  }

  redeemPoints(request: RedeemPointsRequest): Observable<{ success: boolean; newBalance: number }> {
    // TODO: Implement HTTP call
    console.log('LoyaltyService.redeemPoints() called with:', request);
    return of({ success: false, newBalance: 0 });
  }

  calculatePointsValue(points: number): number {
    // 100 points = 1 TND
    return points / 100;
  }

  calculatePointsForPurchase(amount: number): number {
    const account = this.account();
    const level = account?.level ?? LoyaltyLevel.BRONZE;
    const levelInfo = LOYALTY_LEVELS.find(l => l.level === level);
    const multiplier = levelInfo?.multiplier ?? 1;
    // Base: 1 point per 1 TND, multiplied by level
    return Math.floor(amount * multiplier);
  }

  getLevelBenefits(level: LoyaltyLevel): string[] {
    return LOYALTY_LEVELS.find(l => l.level === level)?.benefits ?? [];
  }

  getLevelThreshold(level: LoyaltyLevel): { min: number; max: number } {
    const levelInfo = LOYALTY_LEVELS.find(l => l.level === level);
    return { min: levelInfo?.minPoints ?? 0, max: levelInfo?.maxPoints ?? 0 };
  }
}
